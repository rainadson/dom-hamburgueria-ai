import { supabase } from "../lib/supabase";

export const authService = {

  async login(email: string, password: string) {

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return data;
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async getSession() {

    const { data } = await supabase.auth.getSession();

    return data.session;

  },

  async getUser() {

    const { data } = await supabase.auth.getUser();

    return data.user;

  },

  async getProfile() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;
    const base=import.meta.env.VITE_API_URL?.trim()||"https://dom-hamburgueria-ai.onrender.com/api";
    const storeId=localStorage.getItem("dom-active-store-id");
    const headers:Record<string,string>={Authorization:`Bearer ${token}`};
    if(storeId)headers["X-Store-Id"]=storeId;
    const response=await fetch(`${base}/session`,{headers});
    if(!response.ok)return null;
    return response.json();
  },

  async getStores() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return [];
    const base=import.meta.env.VITE_API_URL?.trim()||"https://dom-hamburgueria-ai.onrender.com/api";
    const response=await fetch(`${base}/stores`,{headers:{Authorization:`Bearer ${token}`}});
    if(!response.ok)throw new Error("Não foi possível carregar as lojas.");
    return response.json();
  },

  async createStore(name:string) {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("Sessão expirada.");
    const base=import.meta.env.VITE_API_URL?.trim()||"https://dom-hamburgueria-ai.onrender.com/api";
    const response=await fetch(`${base}/stores`,{method:"POST",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({name})});
    const body=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(body.message||"Não foi possível criar a loja.");
    return body;
  },

};
