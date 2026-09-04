import axios from "axios";
import { supabase } from "../lib/supabase";

export const apiBaseUrl =
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
  const storeId = localStorage.getItem("dom-active-store-id");
  if (storeId) config.headers["X-Store-Id"] = storeId;

  return config;
});
