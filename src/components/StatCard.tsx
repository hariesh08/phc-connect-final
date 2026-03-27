import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
}

const StatCard = ({ title, value, subtitle, icon }: StatCardProps) => {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">{title}</span>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
    </div>
  );
};

export default StatCard;
