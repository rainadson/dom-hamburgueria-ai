import { createHmac, timingSafeEqual } from "node:crypto";
import { Router, raw } from "express";

export function validMetaSignature(body:Buffer, signature:unknown, secret:string):boolean {
  if (!secret || typeof signature!=="string" || !/^sha256=[a-f0-9]{64}$/i.test(signature)) return false;
  const expected=createHmac("sha256",secret).update(body).digest();
  return timingSafeEqual(expected,Buffer.from(signature.slice(7),"hex"));
}
function sameToken(actual:unknown,expected:string){
  if(typeof actual!=="string"||!expected)return false;
  const a=Buffer.from(actual),b=Buffer.from(expected);
  return a.length===b.length&&timingSafeEqual(a,b);
}
type Config={verifyToken:string;appSecret:string};
// Fábrica não montada em app.ts. Exige armazenamento durável antes do ACK.
// Montar ANTES de express.json(), apenas após fila, deduplicação e testes reais.
export function createMetaWebhook(config:Config, persist?: (event:unknown)=>Promise<void>){
  const router=Router();
  router.get("/",(req,res)=>{
    if(!config.verifyToken||!config.appSecret||!persist)return res.sendStatus(503);
    if(req.query['hub.mode']!=="subscribe"||!sameToken(req.query['hub.verify_token'],config.verifyToken))return res.sendStatus(403);
    const challenge=req.query['hub.challenge'];
    if(typeof challenge!=="string"||!challenge.length||challenge.length>2048)return res.sendStatus(400);
    return res.type('text/plain').send(challenge);
  });
  router.post("/",raw({type:"application/json",limit:"1mb",inflate:false}),async(req,res)=>{
    if(!config.appSecret||!config.verifyToken||!persist)return res.sendStatus(503);
    if(!Buffer.isBuffer(req.body))return res.sendStatus(415);
    if(!validMetaSignature(req.body,req.header('x-hub-signature-256'),config.appSecret))return res.sendStatus(403);
    let event:any;
    try{event=JSON.parse(req.body.toString('utf8'));}catch{return res.sendStatus(400);}
    if(event?.object!=="whatsapp_business_account"||!Array.isArray(event.entry))return res.sendStatus(400);
    try{await persist(event);return res.sendStatus(200);}catch{return res.sendStatus(503);}
  });
  return router;
}
