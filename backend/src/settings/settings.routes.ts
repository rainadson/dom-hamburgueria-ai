import {Router} from "express";import {requireRole} from "../middlewares/auth.middleware";import {SettingsService} from "./settings.service";import {SettingsInputError} from "./settings-input";
const router=Router();const service=(req:any)=>new SettingsService(req.auth.storeId);
router.get("/",async(req,res)=>{try{return res.json(await service(req).get());}catch{return res.status(500).json({message:"Não foi possível carregar as configurações."});}});
router.put("/",requireRole("ADMIN"),async(req,res)=>{try{return res.json(await service(req).save(req.body));}catch(error){return res.status(error instanceof SettingsInputError?400:500).json({message:error instanceof SettingsInputError?error.message:"Não foi possível guardar as configurações."});}});
export default router;
