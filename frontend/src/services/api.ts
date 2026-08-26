import axios from "axios";

export const api = axios.create({
  baseURL: "https://dom-hamburgueria-ai.onrender.com/api",
});