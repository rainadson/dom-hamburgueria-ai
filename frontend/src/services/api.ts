import axios from "axios";
import { supabase } from "../lib/supabase";

export const api = axios.create({
  baseURL: "https://dom-hamburgueria-ai.onrender.com/api",
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});
