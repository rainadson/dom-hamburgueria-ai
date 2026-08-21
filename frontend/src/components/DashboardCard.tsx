import type { ReactNode } from "react";
import "../styles/DashboardCard.css";

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  icon?: ReactNode;
}

export default function DashboardCard({
  title,
  value,
  subtitle,
  color = "#2563eb",
  icon,
}: Props) {
  return (
    <div className="dashboard-card">

      <div className="dashboard-card-header">

        <div
          className="dashboard-icon"
          style={{ backgroundColor: color }}
        >
          {icon}
        </div>

        <div>
          <span className="dashboard-title">
            {title}
          </span>

          {subtitle && (
            <p className="dashboard-subtitle">
              {subtitle}
            </p>
          )}
        </div>

      </div>

      <h2 className="dashboard-value">
        {value}
      </h2>

    </div>
  );
}