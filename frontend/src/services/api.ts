import axios from "axios";
import { supabase } from "../lib/supabase";

const apiBaseUrl =
  import.meta.env.VITE_API_URL?.trim() ||
  "https://dom-hamburgueria-ai.onrender.com/api";

export const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});
