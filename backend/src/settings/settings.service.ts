import {SettingsRepository} from "./settings.repository";
import {settingsInput} from "./settings-input";
export const defaultSettings={restaurant_name:"Dom Hamburgueria",phone:null,address:null,opening_hours:null,delivery_fee:null,delivery_fee_rules:[{max_km:4,fee:4},{max_km:8,fee:6},{max_km:12,fee:9}],payment_methods:["DINHEIRO","MULTIBANCO"],ai_greeting:null,ai_unknown_reply:null,ai_personality:null,updated_at:null};
export class SettingsService{private repository:SettingsRepository;constructor(storeId:string){this.repository=new SettingsRepository(storeId);}async get(){return (await this.repository.get())||defaultSettings;}async save(value:any){return this.repository.save(settingsInput(value));}}
