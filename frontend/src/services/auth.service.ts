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
    const response=await fetch(`${base}/session`,{headers:{Authorization:`Bearer ${token}`}});
    if(!response.ok)return null;
    return response.json();
  },

};
