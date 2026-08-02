type HeaderProps = {
  total: number;
  pending: number;
  preparing: number;
  ready: number;
};

export default function Header({
  total,
  pending,
  preparing,
  ready,
}: HeaderProps) {
  return (
    <header className="header">

      <div>
        <h1 className="logo">🍔 <span>Tas AI Kitchen</span></h1>
        <p>Sistema Inteligente para Restaurantes</p>
      </div>

      <div className="stats">

        <div className="stat-card">
          <h2>{total}</h2>
          <span>Pedidos</span>
        </div>

        <div className="stat-card pending">
          <h2>{pending}</h2>
          <span>Pendentes</span>
        </div>

        <div className="stat-card preparing">
          <h2>{preparing}</h2>
          <span>Preparando</span>
        </div>

        <div className="stat-card ready">
          <h2>{ready}</h2>
          <span>Prontos</span>
        </div>

      </div>

    </header>
  );
}