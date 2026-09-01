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

    const user = await this.getUser();

    if (!user) {
      return null;
    }

    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, user_id, name, role")
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Erro ao buscar perfil:", error);
      return null;
    }

    return data;
  },

};