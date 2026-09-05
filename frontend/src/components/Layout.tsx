import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { authService } from "../services/auth.service";
import "../styles/layout.css";
import { useAuth } from "../context/AuthContext";

interface UserProfile {
  id: number;
  user_id: string;
  name: string;
  role: "ADMIN" | "LOJA";
  store_id: string;
}

export default function Layout() {
  const location = useLocation();
  const { stores, activeStore, selectStore, createStore } = useAuth();
  const [collapsed, setCollapsed] = useState(() => window.matchMedia("(max-width: 900px)").matches);
  const [storeOpen, setStoreOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [addingStore, setAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [storeError, setStoreError] = useState("");
  const [savingStore, setSavingStore] = useState(false);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const userProfile = await authService.getProfile();

        setProfile(userProfile);
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadProfile();
  }, []);

  useEffect(() => {
    if (window.matchMedia("(max-width: 900px)").matches) setCollapsed(true);
  }, [location.pathname]);

  async function handleLogout() {
    try {
      await authService.logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  }

  const userName = profile?.name || "Usuário";
  const userRole = profile?.role || "LOJA";

  return (
    <div className={`layout ${collapsed ? "collapsed" : ""}`}>

      <Sidebar collapsed={collapsed} />

      {!collapsed && <button className="sidebar-backdrop" type="button" aria-label="Fechar menu" onClick={() => setCollapsed(true)} />}

      <div className="main-area">

        <header className="topbar">

          <button
            className="toggle-sidebar"
            onClick={() => setCollapsed(!collapsed)}
            type="button"
            aria-label="Alternar menu"
            aria-expanded={!collapsed}
          >
            ☰
          </button>

          <div className="topbar-spacer" />

          {/* LOJA */}

          <div className="topbar-dropdown">

            <button
              className="store-selector"
              type="button"
              onClick={() => {
                setStoreOpen(!storeOpen);
                setUserOpen(false);
              }}
            >

              <span className="store-icon">
                🏪
              </span>

              <span>
                {activeStore?.name || "Dom Hamburgueria"}
              </span>

              <span
                className={`topbar-arrow ${
                  storeOpen ? "open" : ""
                }`}
              >
                ⌄
              </span>

            </button>

            {storeOpen && (

              <div className="dropdown-menu store-menu">

                <div className="dropdown-title">
                  Selecionar loja
                </div>

                {stores.map(store => (
                  <button
                    className={`dropdown-option ${store.id === activeStore?.id ? "active" : ""}`}
                    type="button"
                    key={store.id}
                    onClick={() => selectStore(store)}
                  >
                    <span>🏪 {store.name}</span>
                    {store.id === activeStore?.id && <span>✓</span>}
                  </button>
                ))}

                {userRole === "ADMIN" && (

                  <button
                    className="dropdown-option"
                    type="button"
                    onClick={() => { setAddingStore(true); setStoreError(""); }}
                  >
                    ＋ Adicionar loja
                  </button>

                )}

              </div>

            )}

          </div>

          {addingStore && (
            <div className="store-dialog-backdrop" role="presentation" onMouseDown={() => !savingStore && setAddingStore(false)}>
              <form className="store-dialog" onMouseDown={event => event.stopPropagation()} onSubmit={async event => {
                event.preventDefault(); setStoreError(""); setSavingStore(true);
                try { await createStore(newStoreName); }
                catch (error) { setStoreError(error instanceof Error ? error.message : "Não foi possível criar a loja."); setSavingStore(false); }
              }}>
                <h2>Adicionar loja</h2>
                <p>Crie uma nova unidade para gerir o cardápio, os pedidos e as configurações separadamente.</p>
                <label htmlFor="new-store-name">Nome da loja</label>
                <input id="new-store-name" value={newStoreName} maxLength={100} autoFocus onChange={event => setNewStoreName(event.target.value)} placeholder="Ex.: Dom Hamburgueria - Centro" />
                {storeError && <div className="store-dialog-error">{storeError}</div>}
                <div className="store-dialog-actions">
                  <button type="button" onClick={() => setAddingStore(false)} disabled={savingStore}>Cancelar</button>
                  <button type="submit" disabled={savingStore || newStoreName.trim().length < 2}>{savingStore ? "Criando..." : "Criar loja"}</button>
                </div>
              </form>
            </div>
          )}

          {/* USUÁRIO */}

          <div className="topbar-dropdown">

            <button
              className="user-profile"
              type="button"
              onClick={() => {
                setUserOpen(!userOpen);
                setStoreOpen(false);
              }}
            >

              <div className="user-avatar">
                👤
              </div>

              <div className="user-info">

                <strong>
                  {loadingProfile ? "Carregando..." : userName}
                </strong>

                <span>
                  {loadingProfile ? "..." : userRole}
                </span>

              </div>

              <span
                className={`topbar-arrow ${
                  userOpen ? "open" : ""
                }`}
              >
                ⌄
              </span>

            </button>

            {userOpen && (

              <div className="dropdown-menu user-menu">

                <div className="dropdown-user">

                  <div className="dropdown-user-avatar">
                    👤
                  </div>

                  <div>

                    <strong>
                      {userName}
                    </strong>

                    <span>
                      {userRole}
                    </span>

                  </div>

                </div>

                <div className="dropdown-divider" />

                <button
                  className="dropdown-option"
                  type="button"
                >
                  👤 Meu perfil
                </button>

                <button
                  className="dropdown-option"
                  type="button"
                >
                  ⚙ Configurações
                </button>

                <div className="dropdown-divider" />

                <button
                  className="dropdown-option logout-option"
                  onClick={handleLogout}
                  type="button"
                >
                  ↪ Sair
                </button>

              </div>

            )}

          </div>

        </header>

        <main className="content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}
