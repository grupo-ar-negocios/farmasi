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
  const [selectedProductName, setSelectedProductName] = useState('');
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

  // Get unique products (from inventory and past sales)
  const allProductNames = useMemo(() => {
    const names = new Set<string>();
    products.forEach(p => names.add(p.name));
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.productName) names.add(item.productName);
      });
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [products, sales]);

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
        if (selectedProductName && item.productName !== selectedProductName) return;

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
  }, [sales, clients, salons, dateStart, dateEnd, selectedType, selectedClientId, selectedProductName, quickFilter]);

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

  // Insights
  const insights = useMemo(() => {
    const productStats: Record<string, { name: string, profit: number, revenue: number, quantity: number, cost: number }> = {};
    let brindesQty = 0;
    let brindesLoss = 0;
    let eventosLoss = 0;
    const brindesList: { name: string, date: string, profit: number }[] = [];

    filteredData.forEach(item => {
      // Group by product
      if (!productStats[item.productName]) {
        productStats[item.productName] = { name: item.productName, profit: 0, revenue: 0, quantity: 0, cost: 0 };
      }
      productStats[item.productName].profit += item.profit;
      productStats[item.productName].revenue += item.revenue;
      productStats[item.productName].quantity += item.quantity;
      productStats[item.productName].cost += item.cost;

      // Check brindes and eventos
      const isBrinde = item.unitPrice === 0 || item.clientName.toLowerCase().includes('brinde') || item.productName.toLowerCase().includes('brinde');
      const isEvento = item.clientName.toLowerCase().includes('evento') || item.productName.toLowerCase().includes('evento');

      if (isBrinde) {
        brindesQty += item.quantity;
        if (item.profit < 0) brindesLoss += item.profit;
        brindesList.push({ name: item.productName, date: item.date, profit: item.profit });
      } else if (isEvento) {
        if (item.profit < 0) eventosLoss += item.profit;
      }
    });

    const productsArr = Object.values(productStats);

    const top3Champions = productsArr.filter(p => p.profit > 0).sort((a, b) => b.profit - a.profit).slice(0, 3);
    
    // Top 5 losses
    const lossProducts = productsArr.filter(p => p.profit < 0).sort((a, b) => a.profit - b.profit).slice(0, 5);

    const last5Brindes = brindesList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    return {
      top3Champions,
      lossProducts,
      brindesQty,
      brindesLoss,
      eventosLoss,
      last5Brindes
    };
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
            value={selectedProductName}
            onChange={(e) => setSelectedProductName(e.target.value)}
          >
            <option value="">Todos os Produtos</option>
            {allProductNames.map(name => (
              <option key={name} value={name}>{name}</option>
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <PieChart size={64} />
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Margem %</p>
          <p className="text-2xl font-black text-slate-800 relative z-10">
            {summary.revenue > 0 ? ((summary.profit / summary.revenue) * 100).toFixed(1) : 0}%
          </p>
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

      {/* Insights Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Champion Product */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-amber-100 text-amber-600 p-3 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Produtos Campeões</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Top 3 do período</p>
            </div>
          </div>
          
          {insights.top3Champions.length > 0 ? (
            <div className="space-y-3">
              {insights.top3Champions.map((champion, index) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between bg-amber-50/50 border border-amber-100 p-3 rounded-2xl">
                  <div className="flex items-center gap-3 mb-2 sm:mb-0">
                    <span className="bg-amber-200 text-amber-800 text-xs font-black px-2 py-1 rounded-lg">#{index + 1}</span>
                    <p className="text-sm font-black text-amber-900 line-clamp-1" title={champion.name}>{champion.name}</p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vendidos</p>
                      <p className="text-sm font-bold text-slate-700">{champion.quantity} un</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Margem</p>
                      <p className="text-sm font-bold text-slate-700">{champion.revenue > 0 ? ((champion.profit / champion.revenue) * 100).toFixed(1) : 0}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lucro</p>
                      <p className="text-sm font-black text-emerald-600">{formatProfitCurrency(champion.profit)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-medium text-slate-500 italic">Nenhum produto com lucro no período.</p>
          )}
        </div>

        {/* Losses and Gifts */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-rose-100 text-rose-600 p-3 rounded-2xl">
              <TrendingDown size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Prejuízos & Brindes</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Atenção aos números</p>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-6">
            <div className="flex-1 space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top 5 Prejuízos</p>
              {insights.lossProducts.length > 0 ? (
                <div className="space-y-2">
                  {insights.lossProducts.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-xl">
                      <span className="text-xs font-bold text-slate-700 truncate mr-2" title={p.name}>{p.name}</span>
                      <span className="text-xs font-black text-rose-600 whitespace-nowrap">{formatProfitCurrency(p.profit)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-medium text-slate-500 italic">Nenhum produto deu prejuízo!</p>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Últimos Brindes</p>
                <p className="text-[10px] font-bold text-rose-500 uppercase">Total: {formatProfitCurrency(insights.brindesLoss)}</p>
              </div>
              {insights.last5Brindes.length > 0 ? (
                <div className="space-y-2">
                  {insights.last5Brindes.map((b, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-rose-50 px-3 py-2 rounded-xl border border-rose-100">
                      <span className="text-xs font-bold text-rose-700 truncate mr-2" title={b.name}>{b.name}</span>
                      <span className="text-[10px] font-black text-rose-500 whitespace-nowrap">{formatDate(b.date)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-medium text-slate-500 italic">Nenhum brinde no período.</p>
              )}
              
              {/* Eventos Total */}
              <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl mt-4">
                <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Total em Eventos</p>
                <p className="text-sm font-black text-rose-600">{formatProfitCurrency(insights.eventosLoss)}</p>
              </div>
            </div>
          </div>
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
