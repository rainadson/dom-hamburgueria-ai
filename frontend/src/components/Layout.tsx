import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { authService } from "../services/auth.service";
import "../styles/layout.css";

interface UserProfile {
  id: number;
  user_id: string;
  name: string;
  role: "ADMIN" | "LOJA";
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [storeOpen, setStoreOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

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

      <div className="main-area">

        <header className="topbar">

          <button
            className="toggle-sidebar"
            onClick={() => setCollapsed(!collapsed)}
            type="button"
            aria-label="Alternar menu"
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
                Dom Hamburgueria - Loja 1
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

                <button
                  className="dropdown-option active"
                  type="button"
                >

                  <span>
                    🏪 Dom Hamburgueria - Loja 1
                  </span>

                  <span>
                    ✓
                  </span>

                </button>

                {userRole === "ADMIN" && (

                  <button
                    className="dropdown-option"
                    type="button"
                  >
                    ＋ Adicionar loja
                  </button>

                )}

              </div>

            )}

          </div>

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