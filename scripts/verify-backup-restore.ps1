param([Parameter(Mandatory=$true)][string]$BackupPath)
$ErrorActionPreference='Stop'
$resolved=(Resolve-Path -LiteralPath $BackupPath).Path
$encrypted=[IO.File]::ReadAllBytes($resolved)
$compressed=[Security.Cryptography.ProtectedData]::Unprotect($encrypted,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
$input=New-Object IO.MemoryStream(,$compressed);$gzip=New-Object IO.Compression.GZipStream($input,[IO.Compression.CompressionMode]::Decompress);$reader=New-Object IO.StreamReader($gzip,[Text.Encoding]::UTF8)
$bundle=($reader.ReadToEnd()|ConvertFrom-Json -Depth 100);$reader.Dispose();$gzip.Dispose();$input.Dispose()
if($bundle.format -ne 'dom-ai-logical-backup-v1'){throw 'Formato de backup inválido.'}
$container="dom-ai-restore-$([Guid]::NewGuid().ToString('N').Substring(0,10))";$password=[Guid]::NewGuid().ToString('N')
try{
  docker run -d --name $container -e "POSTGRES_PASSWORD=$password" -e POSTGRES_DB=dom_restore postgres:16-alpine | Out-Null
  $ready=$false
  for($i=0;$i -lt 30;$i++){docker exec $container psql -At -U postgres -d dom_restore -c 'SELECT 1' 2>$null|Out-Null;if($LASTEXITCODE -eq 0){$ready=$true;break};Start-Sleep -Seconds 1}
  if(-not $ready){throw 'PostgreSQL temporário não iniciou.'}
  function Invoke-IsolatedSql([string]$Sql,[switch]$ReturnOutput){$output=$Sql|docker exec -i $container psql -v ON_ERROR_STOP=1 -At -U postgres -d dom_restore 2>&1;if($LASTEXITCODE -ne 0){throw ($output -join "`n")};if($ReturnOutput){return $output}}
  $setup=@'
CREATE ROLE anon; CREATE ROLE authenticated;
CREATE TABLE restored_records(table_name text NOT NULL,row_number integer NOT NULL,source_id text,payload jsonb NOT NULL,PRIMARY KEY(table_name,row_number));
ALTER TABLE restored_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON restored_records FROM PUBLIC,anon,authenticated;
'@
  Invoke-IsolatedSql $setup
  $expected=[ordered]@{}
  foreach($property in $bundle.tables.PSObject.Properties){
    $table=$property.Name;$rows=@($property.Value);while($rows.Count -eq 1 -and $rows[0] -is [array]){$rows=@($rows[0])};$expected[$table]=$rows.Count;$n=0
    foreach($row in $rows){$n++;$json=$row|ConvertTo-Json -Depth 100 -Compress;$b64=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($json));$id=if($null-ne $row.id){[string]$row.id}else{''};$safeId=$id.Replace("'","''");Invoke-IsolatedSql "INSERT INTO restored_records VALUES ('$table',$n,'$safeId',convert_from(decode('$b64','base64'),'UTF8')::jsonb);"}
  }
  $actualJson=((Invoke-IsolatedSql "SELECT json_object_agg(table_name,c) FROM (SELECT table_name,count(*) c FROM restored_records GROUP BY table_name) s;" -ReturnOutput) -join '').Trim();$actual=$actualJson|ConvertFrom-Json
  foreach($entry in $expected.GetEnumerator()){if([int]$actual.($entry.Key) -ne $entry.Value){throw "Contagem divergente em $($entry.Key)."}}
  $orphanItems=[int]((Invoke-IsolatedSql "SELECT count(*) FROM restored_records i WHERE i.table_name='order_items' AND NOT EXISTS (SELECT 1 FROM restored_records o WHERE o.table_name='orders' AND o.source_id=i.payload->>'order_id');" -ReturnOutput) -join '')
  $orphanStores=[int]((Invoke-IsolatedSql "SELECT count(*) FROM restored_records r WHERE r.table_name IN ('products','orders','order_items','conversations','settings','user_profiles') AND r.payload ? 'store_id' AND NOT EXISTS (SELECT 1 FROM restored_records s WHERE s.table_name='stores' AND s.source_id=r.payload->>'store_id');" -ReturnOutput) -join '')
  $duplicateConversations=[int]((Invoke-IsolatedSql "SELECT count(*) FROM (SELECT payload->>'store_id',payload->>'phone',count(*) FROM restored_records WHERE table_name='conversations' GROUP BY 1,2 HAVING count(*)>1) d;" -ReturnOutput) -join '')
  $rls=Invoke-IsolatedSql "SELECT relrowsecurity FROM pg_class WHERE relname='restored_records'; SELECT has_table_privilege('anon','restored_records','SELECT'); SELECT has_table_privilege('authenticated','restored_records','SELECT');" -ReturnOutput
  if($orphanItems -or $orphanStores -or $duplicateConversations -or ($rls -join ',') -ne 't,f,f'){throw 'Falha nas relações, unicidade ou proteção RLS do teste restaurado.'}
  $report=[ordered]@{verified_at=(Get-Date).ToUniversalTime().ToString('o');backup_sha256=(Get-FileHash $resolved -Algorithm SHA256).Hash;counts=$expected;checks=[ordered]@{order_item_orphans=0;store_orphans=0;duplicate_store_phone_conversations=0;rls_enabled=$true;anon_select=$false;authenticated_select=$false};result='PASS'}
  $reportPath="$resolved.restore-report.json";$report|ConvertTo-Json -Depth 10|Set-Content -Encoding utf8 $reportPath
  [pscustomobject]@{Result='PASS';Report=$reportPath;Counts=$expected}
}finally{docker rm -f $container 2>$null|Out-Null}
