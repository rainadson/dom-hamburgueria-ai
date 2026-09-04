import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { authService } from "../services/auth.service";

export interface UserProfile {
  id: number;
  user_id: string;
  name: string;
  role: "ADMIN" | "LOJA";
  store_id: string;
}

export interface StoreOption { id: string; slug: string; name: string; active: boolean; }

interface AuthContextType {
  profile: UserProfile | null;
  loading: boolean;
  stores: StoreOption[];
  activeStore: StoreOption | null;
  selectStore: (store: StoreOption) => void;
  createStore: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  loading: true,
  stores: [],
  activeStore: null,
  selectStore: () => undefined,
  createStore: async () => undefined,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<StoreOption[]>([]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await authService.getProfile();

        setProfile(data);
        if (data?.role === "ADMIN") {
          const available = await authService.getStores();
          setStores(available);
          if (!available.some((store:StoreOption) => store.id === data.store_id) && available[0]) {
            localStorage.setItem("dom-active-store-id", available[0].id);
            window.location.reload();
          }
        } else if (data) {
          setStores([{id:data.store_id,slug:"",name:"Dom Hamburgueria",active:true}]);
          localStorage.removeItem("dom-active-store-id");
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  const activeStore = stores.find(store => store.id === profile?.store_id) || stores[0] || null;
  const selectStore = (store:StoreOption) => {
    if (store.id === activeStore?.id) return;
    localStorage.setItem("dom-active-store-id", store.id);
    window.location.reload();
  };
  const createStore = async (name:string) => {
    const store = await authService.createStore(name);
    localStorage.setItem("dom-active-store-id", store.id);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ profile, loading, stores, activeStore, selectStore, createStore }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
