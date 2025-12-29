
import React, { useMemo } from 'react';
import { Sale, Product, Salon } from '../types';
import { StatCard } from '../components/Card';
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Award,
  PieChart as PieChartIcon,
  Package,
  ArrowUpRight,
  Target
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  salons: Salon[];
}

export const Reports: React.FC<ReportsProps> = ({ sales, products, salons }) => {
  // --- Data Calculations ---

  const totalRevenue = useMemo(() => sales.reduce((acc, s) => acc + s.totalValue, 0), [sales]);
  const totalItemsSold = useMemo(() => sales.reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + i.quantity, 0), 0), [sales]);
  const avgTicket = useMemo(() => sales.length > 0 ? totalRevenue / sales.length : 0, [totalRevenue, sales.length]);

  const totalProfit = useMemo(() => {
    return sales.reduce((acc, sale) => {
      const saleCost = sale.totalCost;
      let commission = 0;
      if (sale.type === 'consignment' && sale.originSalonId) {
        const salon = salons.find(s => String(s.id) === String(sale.originSalonId));
        if (salon) commission = (sale.totalValue * salon.commissionRate) / 100;
      }
      return acc + (sale.totalValue - saleCost - commission);
    }, 0);
  }, [sales, salons]);

  const profitMargin = useMemo(() => totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0, [totalProfit, totalRevenue]);

  // Top Selling Products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string, qty: number, revenue: number }>();
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const existing = map.get(item.productId) || { name: item.productName, qty: 0, revenue: 0 };
        map.set(item.productId, {
          name: item.productName,
          qty: existing.qty + item.quantity,
          revenue: existing.revenue + (item.quantity * item.unitPrice)
        });
      });
    });
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [sales]);

  // Performance by Salon
  const salonPerformance = useMemo(() => {
    return salons.map(salon => {
      const salonSales = sales.filter(s => String(s.originSalonId) === String(salon.id));
      const revenue = salonSales.reduce((acc, s) => acc + s.totalValue, 0);
      return {
        name: salon.name,
        revenue,
        count: salonSales.length
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [salons, sales]);

  // Payment Methods Distribution
  const paymentMethodsData = useMemo(() => {
    const map = { cash: 0, pix: 0, credit: 0, debit: 0 };
    sales.forEach(s => { map[s.paymentMethod] += s.totalValue; });
    return [
      { name: 'Dinheiro', value: map.cash, color: '#f43f5e' },
      { name: 'PIX', value: map.pix, color: '#10b981' },
      { name: 'Crédito', value: map.credit, color: '#6366f1' },
      { name: 'Débito', value: map.debit, color: '#f59e0b' },
    ].filter(d => d.value > 0);
  }, [sales]);

  // Time Series Data
  const chartData = useMemo(() => {
    const dataMap = new Map<string, number>();
    sales.forEach(sale => {
      const date = new Date(sale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      dataMap.set(date, (dataMap.get(date) || 0) + sale.totalValue);
    });
    return Array.from(dataMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name)).slice(-15);
  }, [sales]);

  return (
    <div className="space-y-8 sm:space-y-10 animate-in fade-in duration-500 pb-20 sm:pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-950 uppercase tracking-tighter">Relatórios <span className="text-[#800020] italic">Estratégicos</span></h2>
          <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.4em] mt-2 flex items-center gap-2">
            <Target size={14} className="text-[#800020]" /> Inteligência FARMASI
          </p>
        </div>
        <div className="bg-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-[#800020]/10 flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] sm:text-[11px] font-black text-slate-900 uppercase">Análise de Dados Ativa</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Ticket Médio" value={`R$ ${avgTicket.toFixed(0)}`} icon={Award} color="violet" subtext="Média por venda" />
        <StatCard title="Total Vendidos" value={`${totalItemsSold} un`} icon={ShoppingCart} color="emerald" subtext="Itens despachados" />
        <StatCard title="Margem Média" value={`${profitMargin.toFixed(1)}%`} icon={TrendingUp} color="blue" subtext="Eficiência de lucro" />
        <StatCard title="Faturamento" value={`R$ ${totalRevenue.toLocaleString()}`} icon={BarChart3} color="amber" subtext="Receita Bruta" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Main Revenue Chart */}
        <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-slate-50 shadow-sm">
          <h3 className="text-[11px] sm:text-xs font-black text-slate-950 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-8 sm:mb-12">Evolução de Faturamento</h3>
          <div className="h-64 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#800020" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#800020" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} dy={10} />
                <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontWeight: 900, fontSize: '10px' }} />
                <Area type="monotone" dataKey="value" stroke="#800020" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[3rem] border border-slate-50 shadow-sm flex flex-col items-center">
          <h3 className="text-[11px] sm:text-xs font-black text-slate-950 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-6 sm:mb-8 w-full">Meios de Pagamento</h3>
          <div className="h-48 sm:h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentMethodsData} innerRadius={50} outerRadius={70} paddingAngle={8} dataKey="value">
                  {paymentMethodsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <PieChartIcon className="text-slate-100" size={24} />
            </div>
          </div>
          <div className="w-full mt-4 sm:mt-6 space-y-2">
            {paymentMethodsData.map(method => (
              <div key={method.name} className="flex items-center justify-between text-[9px] sm:text-[10px] font-black uppercase">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: method.color }}></div>
                  <span className="text-slate-500">{method.name}</span>
                </div>
                <span className="text-slate-950">R$ {method.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Top Products */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-slate-50 shadow-sm">
          <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
            <div className="p-3 sm:p-4 bg-emerald-50 text-emerald-500 rounded-xl sm:rounded-2xl shrink-0"><Award size={24} /></div>
            <div>
              <h3 className="text-[11px] sm:text-xs font-black text-slate-950 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Top 5 Produtos</h3>
              <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">Volume de Vendas</p>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between p-4 sm:p-5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 group transition-all">
                <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                  <span className="text-base sm:text-lg font-black text-emerald-300">#0{i + 1}</span>
                  <div className="overflow-hidden">
                    <p className="text-[11px] font-black text-slate-950 uppercase truncate">{p.name}</p>
                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">{p.qty} un</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[12px] sm:text-sm font-black text-slate-950">R$ {p.revenue.toLocaleString()}</p>
                  <ArrowUpRight size={14} className="text-emerald-500 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Salon Performance */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] border border-slate-50 shadow-sm">
          <div className="flex items-center gap-3 sm:gap-4 mb-8 sm:mb-10">
            <div className="p-3 sm:p-4 bg-blue-50 text-blue-500 rounded-xl sm:rounded-2xl shrink-0"><BarChart3 size={24} /></div>
            <div>
              <h3 className="text-[11px] sm:text-xs font-black text-slate-950 uppercase tracking-[0.2em] sm:tracking-[0.3em]">Performance Parceiros</h3>
              <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">Receita por Salão</p>
            </div>
          </div>
          <div className="space-y-4 sm:space-y-6">
            {salonPerformance.map((salon) => (
              <div key={salon.name} className="space-y-2">
                <div className="flex justify-between text-[10px] sm:text-[11px] font-black uppercase overflow-hidden">
                  <span className="text-slate-950 truncate mr-4">{salon.name}</span>
                  <span className="text-[#800020] shrink-0">R$ {salon.revenue.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 sm:h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                  <div
                    className="h-full bg-[#800020]/80 rounded-full transition-all duration-1000"
                    style={{ width: `${(salon.revenue / (salonPerformance[0]?.revenue || 1)) * 100}%` }}
                  />
                </div>
                <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase text-right">{salon.count} vendas</p>
              </div>
            ))}
            {salonPerformance.length === 0 && (
              <div className="py-16 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">Nenhum dado disponível</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
