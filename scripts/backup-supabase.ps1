param([string]$OutputDirectory)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
if(-not $OutputDirectory){$OutputDirectory=Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'Dom AI Backups'}
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$envValues=@{}
Get-Content (Join-Path $projectRoot 'backend/.env') | ForEach-Object {if($_ -match '^([^#=]+)=(.*)$'){$envValues[$matches[1]]=$matches[2].Trim('"')}}
$base=$envValues.SUPABASE_URL
$key=$envValues.SUPABASE_SERVICE_ROLE_KEY
if(-not $base -or -not $key){throw 'Credenciais locais do Supabase não encontradas.'}
$headers=@{apikey=$key;Authorization="Bearer $key";Prefer='count=exact'}
$tables=@('stores','products','orders','order_items','conversations','settings','user_profiles')
$data=[ordered]@{}
foreach($table in $tables){
  $rows=@();$from=0
  do{
    $page=@(Invoke-RestMethod -Uri "$base/rest/v1/$table`?select=*&limit=1000&offset=$from" -Headers $headers)
    $rows+=$page;$from+=1000
  }while($page.Count -eq 1000)
  $data[$table]=$rows
}
$authResponse=Invoke-RestMethod -Uri "$base/auth/v1/admin/users?per_page=1000&page=1" -Headers $headers
$authUsers=@($authResponse.users | ForEach-Object {[ordered]@{id=$_.id;email=$_.email;created_at=$_.created_at;updated_at=$_.updated_at;app_metadata=$_.app_metadata;user_metadata=$_.user_metadata}})
$migrationHashes=[ordered]@{}
Get-ChildItem (Join-Path $projectRoot 'database') -Filter '*.sql' | Sort-Object Name | ForEach-Object {$migrationHashes[$_.Name]=(Get-FileHash $_.FullName -Algorithm SHA256).Hash}
$bundle=[ordered]@{format='dom-ai-logical-backup-v1';created_at=(Get-Date).ToUniversalTime().ToString('o');git_commit=(git -C $projectRoot rev-parse HEAD).Trim();migration_sha256=$migrationHashes;tables=$data;auth_users=$authUsers}
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
$plain=[Text.Encoding]::UTF8.GetBytes(($bundle|ConvertTo-Json -Depth 100 -Compress))
$compressedStream=New-Object IO.MemoryStream
$gzip=New-Object IO.Compression.GZipStream($compressedStream,[IO.Compression.CompressionMode]::Compress,$true)
$gzip.Write($plain,0,$plain.Length);$gzip.Dispose()
$compressed=$compressedStream.ToArray();$compressedStream.Dispose()
$encrypted=[Security.Cryptography.ProtectedData]::Protect($compressed,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser)
$backupPath=Join-Path $OutputDirectory "dom-ai-$stamp.backup"
[IO.File]::WriteAllBytes($backupPath,$encrypted)
$counts=[ordered]@{};foreach($table in $tables){$rows=@($data[$table]);while($rows.Count -eq 1 -and $rows[0] -is [array]){$rows=@($rows[0])};$counts[$table]=$rows.Count};$counts.auth_users=$authUsers.Count
$manifest=[ordered]@{backup_file=(Split-Path $backupPath -Leaf);created_at=$bundle.created_at;git_commit=$bundle.git_commit;encrypted_with='Windows DPAPI CurrentUser';sha256=(Get-FileHash $backupPath -Algorithm SHA256).Hash;counts=$counts}
$manifestPath="$backupPath.manifest.json";$manifest|ConvertTo-Json -Depth 10|Set-Content -Encoding utf8 $manifestPath
[pscustomobject]@{Backup=$backupPath;Manifest=$manifestPath;Counts=$counts}
