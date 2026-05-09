import React, { useState, useMemo } from 'react';
import { Sale, Product, Client, Salon, Consignment } from '../types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Calendar,
  Filter,
  BarChart2,
  PieChart,
  User,
  ShoppingBag,
  Store
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface AnalyticsProps {
  sales: Sale[];
  products: Product[];
  clients: Client[];
  salons: Salon[];
}

export const Analytics: React.FC<AnalyticsProps> = ({ sales, products, clients, salons }) => {
  // Filters state
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedType, setSelectedType] = useState<'' | 'direct' | 'consignment'>('');
  const [quickFilter, setQuickFilter] = useState<'all' | 'today' | 'month' | 'negative_profit'>('all');

  // Helper to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatProfitCurrency = (value: number) => {
    const isNegative = value < 0;
    const isPositive = value > 0;
    const formatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(value));
    
    if (isPositive) return `+ ${formatted}`;
    if (isNegative) return `- ${formatted}`;
    return formatted;
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Quick filter helpers
  const applyQuickFilter = (filter: 'all' | 'today' | 'month' | 'negative_profit') => {
    setQuickFilter(filter);
    if (filter === 'all' || filter === 'negative_profit') {
      setDateStart('');
      setDateEnd('');
    } else if (filter === 'today') {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      setDateStart(dateString);
      setDateEnd(dateString);
    } else if (filter === 'month') {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const startString = `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}-01`;
      const endString = `${endOfMonth.getFullYear()}-${String(endOfMonth.getMonth() + 1).padStart(2, '0')}-${String(endOfMonth.getDate()).padStart(2, '0')}`;
      setDateStart(startString);
      setDateEnd(endString);
    }
  };

  // Get unique products that have been sold
  const soldProducts = useMemo(() => {
    const soldMap = new Map<string, string>();
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!soldMap.has(item.productId)) {
          soldMap.set(item.productId, item.productName);
        }
      });
    });
    return Array.from(soldMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sales]);

  // Data processing
  const filteredData = useMemo(() => {
    let explodedItems: any[] = [];

    sales.forEach(sale => {
      // Calculate commission for the entire sale
      let saleCommissionRate = 0;
      if (sale.type === 'consignment' && sale.originSalonId) {
        const salon = salons.find(s => s.id === sale.originSalonId);
        if (salon) {
          saleCommissionRate = salon.commissionRate / 100;
        }
      }

      // Check dates safely
      const saleDateObj = new Date(sale.date);
      const saleDateString = `${saleDateObj.getFullYear()}-${String(saleDateObj.getMonth() + 1).padStart(2, '0')}-${String(saleDateObj.getDate()).padStart(2, '0')}`;
      
      if (dateStart && saleDateString < dateStart) return;
      if (dateEnd && saleDateString > dateEnd) return;
      
      // Check type
      if (selectedType && sale.type !== selectedType) return;
      
      // Check client
      if (selectedClientId && sale.clientId !== selectedClientId) return;

      const client = clients.find(c => c.id === sale.clientId);
      const clientName = client ? client.name : 'Cliente Excluído';

      sale.items.forEach(item => {
        // Check product filter
        if (selectedProductId && item.productId !== selectedProductId) return;

        const itemRevenue = item.unitPrice * item.quantity;
        const itemCost = item.unitCost * item.quantity;
        const itemCommission = itemRevenue * saleCommissionRate;
        const itemProfit = itemRevenue - itemCost - itemCommission;

        // Negative profit filter
        if (quickFilter === 'negative_profit' && itemProfit >= 0) return;

        explodedItems.push({
          saleId: sale.id,
          date: sale.date,
          clientId: sale.clientId,
          clientName: clientName,
          type: sale.type,
          originSalonId: sale.originSalonId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unitCost: item.unitCost,
          revenue: itemRevenue,
          cost: itemCost,
          commission: itemCommission,
          profit: itemProfit,
        });
      });
    });

    // Sort by date descending
    explodedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return explodedItems;
  }, [sales, clients, salons, dateStart, dateEnd, selectedType, selectedClientId, selectedProductId, quickFilter]);

  // Aggregations
  const summary = useMemo(() => {
    return filteredData.reduce((acc, curr) => {
      acc.revenue += curr.revenue;
      acc.cost += curr.cost;
      acc.commission += curr.commission;
      acc.profit += curr.profit;
      acc.quantity += curr.quantity;
      return acc;
    }, { revenue: 0, cost: 0, commission: 0, profit: 0, quantity: 0 });
  }, [filteredData]);

  // Chart data (grouped by date)
  const chartData = useMemo(() => {
    const groupedByDate: Record<string, { date: string, revenue: number, profit: number, timestamp: number }> = {};
    
    filteredData.forEach(item => {
      const dateObj = new Date(item.date);
      const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      
      if (!groupedByDate[dateStr]) {
        // Create an explicit date object at noon to avoid timezone shift issues
        const noonDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 12, 0, 0);
        
        groupedByDate[dateStr] = { 
          date: noonDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), 
          revenue: 0, 
          profit: 0,
          timestamp: noonDate.getTime()
        };
      }
      groupedByDate[dateStr].revenue += item.revenue;
      groupedByDate[dateStr].profit += item.profit;
    });

    // Convert to array and sort chronologically (oldest to newest)
    return Object.values(groupedByDate).sort((a, b) => a.timestamp - b.timestamp);
  }, [filteredData]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#800020] tracking-tighter">Análises de Vendas</h1>
          <p className="text-slate-500 font-medium">Relatórios detalhados de faturamento, lucro e desempenho</p>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button 
          onClick={() => applyQuickFilter('all')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${quickFilter === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          Todo o Período
        </button>
        <button 
          onClick={() => applyQuickFilter('today')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${quickFilter === 'today' ? 'bg-[#800020] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          Hoje
        </button>
        <button 
          onClick={() => applyQuickFilter('month')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${quickFilter === 'month' ? 'bg-[#800020] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          Este Mês
        </button>
        <button 
          onClick={() => applyQuickFilter('negative_profit')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${quickFilter === 'negative_profit' ? 'bg-rose-500 text-white shadow-md' : 'bg-white text-rose-500 border border-rose-100 hover:bg-rose-50'}`}
        >
          <TrendingDown size={16} /> Prejuízo
        </button>
      </div>

      {/* Advanced Filters */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Data Inicial</label>
          <input 
            type="date" 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Data Final</label>
          <input 
            type="date" 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Produto</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
          >
            <option value="">Todos os Produtos</option>
            {soldProducts.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cliente</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
          >
            <option value="">Todos os Clientes</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo de Venda</label>
          <select 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as any)}
          >
            <option value="">Todos os Tipos</option>
            <option value="direct">Estoque Direto</option>
            <option value="consignment">Consignado</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign size={64} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Faturamento Total</p>
          <p className="text-2xl font-black text-slate-800 relative z-10">{formatCurrency(summary.revenue)}</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${
             summary.profit > 0 ? 'text-emerald-500' : summary.profit < 0 ? 'text-rose-500' : 'text-slate-500'
          }`}>
            {summary.profit >= 0 ? <TrendingUp size={64} /> : <TrendingDown size={64} />}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Lucro Líquido</p>
          <p className={`text-2xl font-black relative z-10 ${
            summary.profit > 0 ? 'text-emerald-500' : summary.profit < 0 ? 'text-rose-500' : 'text-slate-800'
          }`}>{formatProfitCurrency(summary.profit)}</p>
        </div>
        
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <User size={64} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Comissões Pagas</p>
          <p className="text-2xl font-black text-slate-800 relative z-10">{formatCurrency(summary.commission)}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Package size={64} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Produtos Vendidos</p>
          <p className="text-2xl font-black text-slate-800 relative z-10">{summary.quantity} unid.</p>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
            <BarChart2 className="text-[#3b82f6]" size={20} />
            Evolução de Vendas e Lucro
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(value) => `R$ ${value}`} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', padding: '12px 16px' }}
                  itemStyle={{ fontWeight: 'bold' }}
                  formatter={(value: number, name: string) => [name === 'Lucro' ? formatProfitCurrency(value) : formatCurrency(value), '']}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Area type="monotone" dataKey="revenue" name="Faturamento" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="profit" name="Lucro" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-800">Detalhamento de Vendas</h3>
          <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{filteredData.length} registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap">Data</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Produto</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Cliente</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Qtd</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Valor (Un)</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Faturamento</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Custo</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Lucro Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    Nenhum registro encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={`${item.saleId}-${item.productId}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-600 whitespace-nowrap">{formatDate(item.date)}</td>
                    <td className="p-4 text-sm font-bold text-slate-900">
                      {item.productName}
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mt-0.5">
                        {item.type === 'consignment' ? 'Consignado' : 'Estoque Direto'}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-medium text-slate-600">{item.clientName}</td>
                    <td className="p-4 text-sm font-bold text-slate-800">{item.quantity}</td>
                    <td className="p-4 text-sm font-medium text-slate-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="p-4 text-sm font-bold text-slate-800">{formatCurrency(item.revenue)}</td>
                    <td className="p-4 text-sm font-medium text-slate-500">{formatCurrency(item.cost)}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                        item.profit > 0 ? 'bg-emerald-50 text-emerald-600' : 
                        item.profit < 0 ? 'bg-rose-50 text-rose-600' : 
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {formatProfitCurrency(item.profit)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
