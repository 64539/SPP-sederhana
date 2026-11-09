import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: string;
  color?: string;
}

export function StatCard({ title, value }: StatCardProps) {
  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
        {title}
      </p>
      <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}
