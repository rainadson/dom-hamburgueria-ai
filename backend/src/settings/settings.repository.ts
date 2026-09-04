import {supabase} from "../database/supabase";
export class SettingsRepository{
 constructor(private storeId:string){}
 async get(){const {data,error}=await supabase.from("settings").select("restaurant_name,phone,address,opening_hours,delivery_fee,delivery_fee_rules,payment_methods,ai_greeting,ai_unknown_reply,ai_personality,updated_at").eq("store_id",this.storeId).maybeSingle();if(error)throw error;return data;}
 async save(value:any){const {data,error}=await supabase.from("settings").upsert({...value,store_id:this.storeId},{onConflict:"store_id"}).select("restaurant_name,phone,address,opening_hours,delivery_fee,delivery_fee_rules,payment_methods,ai_greeting,ai_unknown_reply,ai_personality,updated_at").single();if(error)throw error;return data;}
}
