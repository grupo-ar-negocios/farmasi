import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  color: 'violet' | 'emerald' | 'blue' | 'amber' | 'rose' | 'indigo';
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, subtext, color }) => {
  // Configuração de cores baseada no pedido: Fundo rosé fraco puxando pra branco, texto preto
  const baseStyles = "bg-[#fffafa] border border-rose-100 rounded-2xl p-6 shadow-sm transition-transform hover:-translate-y-1";

  const iconColors = {
    violet: 'text-violet-600 bg-violet-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    blue: 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
    rose: 'text-rose-600 bg-rose-50',
    indigo: 'text-indigo-600 bg-indigo-50',
  };

  return (
    <div className={baseStyles}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
          <h3 className="text-2xl font-black text-slate-950">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${iconColors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      {subtext && <p className="mt-4 text-xs font-semibold text-slate-400">{subtext}</p>}
    </div>
  );
};