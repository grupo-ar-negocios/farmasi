
import React, { useRef, useState } from 'react';
import { StatCard } from '../components/Card';
import { Product, Sale, Consignment, Salon, ViewState } from '../types';
import {
  DollarSign,
  TrendingUp,
  Package,
  Handshake,
  Users,
  Store,
  ShoppingCart,
  Download,
  Upload,
  ArrowUpRight,
  History,
  Activity,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { storage } from '../services/storage';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface DashboardProps {
  sales: Sale[];
  products: Product[];
  consignments: Consignment[];
  salons: Salon[];
  onQuickAction: (view: ViewState) => void;
  onImportProducts: (newProducts: Product[]) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ sales, products, consignments, salons, onQuickAction, onImportProducts }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalValue, 0);
  let totalProfit = 0;
  sales.forEach(sale => {
    const saleCost = sale.totalCost;
    let commission = 0;
    if (sale.type === 'consignment' && sale.originSalonId) {
      const salon = salons.find(s => String(s.id) === String(sale.originSalonId));
      if (salon) commission = (sale.totalValue * salon.commissionRate) / 100;
    }
    totalProfit += (sale.totalValue - saleCost - commission);
  });

  const inventoryValue = products.reduce((acc, p) => acc + (p.stockQuantity * p.costPrice), 0);
  const consignedValue = products.reduce((acc, p) => acc + (p.consignedQuantity * p.costPrice), 0);

  const chartDataMap = new Map<string, number>();
  sales.forEach(sale => {
    const date = new Date(sale.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    chartDataMap.set(date, (chartDataMap.get(date) || 0) + sale.totalValue);
  });
  const chartData = Array.from(chartDataMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name)).slice(-10);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportProgress(10);
    setFeedback(null);

    try {
      const importedProducts = await storage.parseProductsFromExcel(file, (p) => setImportProgress(p));

      // Simula um pequeno delay para a barra de progresso ser visível e charmosa
      await new Promise(r => setTimeout(r, 800));

      if (importedProducts.length > 0) {
        onImportProducts(importedProducts);
        setFeedback({
          type: 'success',
          message: `Importação concluída! ${importedProducts.length} itens processados com sucesso.`
        });
      } else {
        setFeedback({
          type: 'error',
          message: "Nenhum dado válido encontrado. Verifique as colunas Código, Nome e Preços."
        });
      }
    } catch (error: any) {
      setFeedback({
        type: 'error',
        message: error.message || "Erro ao ler o arquivo. Verifique se as colunas estão corretas."
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
      // Remove o feedback após 5 segundos
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  const QuickActionButton = ({ icon: Icon, label, onClick, bgColor, iconColor }: any) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-6 rounded-[2rem] transition-all hover:scale-105 active:scale-95 shadow-sm border border-rose-100 bg-white group hover:border-rose-300">
      <div className={`${bgColor} p-5 rounded-2xl mb-3 shadow-inner transition-transform group-hover:scale-110`}>
        <Icon size={28} className={iconColor} />
      </div>
      <span className="font-black text-[11px] text-slate-950 uppercase tracking-widest">{label}</span>
    </button>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 relative">

      {/* Overlay de Importação */}
      {isImporting && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-white">
          <div className="w-full max-w-md space-y-8 text-center animate-in zoom-in duration-300">
            <Loader2 size={64} className="mx-auto text-rose-500 animate-spin mb-4" />
            <h2 className="text-3xl font-black uppercase tracking-tighter">Lendo sua Planilha</h2>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em]">Aguarde enquanto organizamos os dados do Studio Luzi...</p>

            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-rose-500 transition-all duration-500 ease-out"
                style={{ width: `${importProgress}%` }}
              ></div>
            </div>
            <span className="text-rose-500 font-black text-xs">{importProgress}%</span>
          </div>
        </div>
      )}

      {/* Toast de Feedback */}
      {feedback && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-4 px-8 py-4 rounded-2xl shadow-2xl border-2 animate-in slide-in-from-top-10 duration-500 ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-rose-50 border-rose-500 text-rose-900'}`}>
          {feedback.type === 'success' ? <CheckCircle2 className="text-emerald-500" /> : <AlertCircle className="text-rose-500" />}
          <span className="font-black uppercase text-[11px] tracking-wider">{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="ml-4 opacity-50 hover:opacity-100"><Activity size={16} /></button>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h2 className="text-5xl font-black text-slate-950 uppercase tracking-tighter leading-none">Studio Luzi <span className="text-rose-500 italic block mt-2">Farmasi</span></h2>
          <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] mt-4 flex items-center gap-2">
            <Activity size={14} className="text-rose-500" /> Gestão Administrativa
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap gap-4">
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileImport} />
            <button
              disabled={isImporting}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 bg-white text-slate-950 border-2 border-slate-950 px-6 py-4 rounded-2xl hover:bg-slate-50 transition-all text-[11px] font-black uppercase tracking-widest disabled:opacity-50"
            >
              <Upload size={18} /> Importar Estoque
            </button>
            <button onClick={() => storage.exportToExcel(products)} className="flex items-center gap-3 bg-slate-950 text-white px-8 py-4 rounded-2xl hover:bg-black transition-all text-[11px] font-black uppercase tracking-widest shadow-xl">
              <Download size={18} /> Backup
            </button>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-2">
            <Info size={12} className="text-blue-400" /> Colunas: Código | Nome | Custo | Venda | Estoque
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-6">
        <QuickActionButton icon={ShoppingCart} label="Vendas" onClick={() => onQuickAction('sales')} bgColor="bg-rose-50" iconColor="text-rose-500" />
        <QuickActionButton icon={Package} label="Estoque" onClick={() => onQuickAction('inventory')} bgColor="bg-emerald-50" iconColor="text-emerald-500" />
        <QuickActionButton icon={Handshake} label="Consignados" onClick={() => onQuickAction('consignments')} bgColor="bg-blue-50" iconColor="text-blue-500" />
        <QuickActionButton icon={Store} label="Salões" onClick={() => onQuickAction('salons')} bgColor="bg-amber-50" iconColor="text-amber-500" />
        <QuickActionButton icon={Users} label="Clientes" onClick={() => onQuickAction('clients')} bgColor="bg-violet-50" iconColor="text-violet-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Faturamento" value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} icon={DollarSign} color="violet" subtext="Receita acumulada" />
        <StatCard title="Lucro Real" value={`R$ ${totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} icon={TrendingUp} color="emerald" subtext="Resultado líquido" />
        <StatCard title="Consignado" value={`R$ ${consignedValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} icon={Handshake} color="blue" subtext="Mercadoria externa" />
        <StatCard title="Patrimônio" value={`R$ ${inventoryValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`} icon={Package} color="amber" subtext="Valor em estoque" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 bg-white p-10 rounded-[3rem] shadow-sm border border-rose-100">
          <div className="flex justify-between items-center mb-16">
            <h3 className="text-sm font-black text-slate-950 uppercase tracking-[0.3em]">Fluxo de Caixa</h3>
            <div className="bg-[#fffafa] px-4 py-2 rounded-full border border-rose-50 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-950 uppercase">Tempo Real</span>
            </div>
          </div>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={15} />
                <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', fontWeight: 900, fontSize: '11px' }} />
                <Area type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={5} fillOpacity={1} fill="url(#colorVal)" dot={{ r: 6, fill: '#fff', strokeWidth: 3, stroke: '#f43f5e' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-10 rounded-[3rem] shadow-sm border border-rose-100 flex flex-col h-full">
          <div className="flex items-center gap-4 mb-10">
            <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl">
              <History size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-[0.3em]">Últimas Vendas</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Atividade Recente</p>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[450px]">
            {sales.slice().reverse().slice(0, 8).map(sale => (
              <div key={sale.id} className="flex items-center justify-between p-5 bg-[#fffafa] rounded-2xl border border-rose-50 hover:border-rose-200 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${sale.type === 'direct' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                    <ArrowUpRight size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-slate-950 uppercase">{sale.items.length} {sale.items.length === 1 ? 'item' : 'itens'}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(sale.date).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-950">R$ {sale.totalValue.toFixed(0)}</p>
                  <p className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full inline-block mt-1 ${sale.type === 'direct' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                    {sale.type === 'direct' ? 'Estoque' : 'Salão'}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onQuickAction('sales')} className="w-full mt-8 py-4 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-lg">Ver Todas</button>
        </div>
      </div>
    </div>
  );
};
