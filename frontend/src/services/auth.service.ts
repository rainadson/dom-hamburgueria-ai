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

};