import { type ReactNode } from "react";

interface SectionHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor?: string;
}

export function SectionHeader({ icon, title, subtitle, badge, badgeColor = "bg-blue-100 text-blue-700" }: SectionHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-white shadow-md">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
            <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${badgeColor}`}>{badge}</span>
          </div>
          <p className="text-sm text-slate-500">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}
