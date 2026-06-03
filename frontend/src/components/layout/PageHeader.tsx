import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, badge, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-cyber-accent/10 border border-cyber-accent/20 flex items-center justify-center shadow-cyber-sm">
          <Icon className="w-5 h-5 text-cyber-accent" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-cyber-text">{title}</h1>
            {badge && (
              <span className="badge-info text-[10px]">{badge}</span>
            )}
          </div>
          {subtitle && (
            <p className="text-sm text-cyber-muted-light mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
