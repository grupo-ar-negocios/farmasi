import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { Calculator, Plus, Trash2, Tag, TrendingUp, HelpCircle, Package } from 'lucide-react';
import { formatCurrency } from '../services/utils';

interface SimulatorProps {
  products: Product[];
}

interface SimulatedItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  simulatedSellPrice: number;
}

export const Simulator: React.FC<SimulatorProps> = ({ products }) => {
  const [cart, setCart] = useState<SimulatedItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<number | ''>('');

  const activeProducts = useMemo(() => {
    return products.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  const selectedProduct = useMemo(() => {
    return activeProducts.find(p => p.id === selectedProductId);
  }, [selectedProductId, activeProducts]);

  // Update custom price field automatically when selecting a product
  React.useEffect(() => {
    if (selectedProduct) {
      setCustomPrice(selectedProduct.sellPrice);
      setQuantity(1);
    } else {
      setCustomPrice('');
      setQuantity(1);
    }
  }, [selectedProductId, selectedProduct]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity || quantity <= 0 || customPrice === '') return;

    const newItem: SimulatedItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: Number(quantity),
      costPrice: selectedProduct.costPrice,
      simulatedSellPrice: Number(customPrice),
    };

    setCart([...cart, newItem]);
    
    // Reset inputs
    setSelectedProductId('');
    setCustomPrice('');
    setQuantity(1);
  };

  const handleRemoveItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Calculations
  const totals = useMemo(() => {
    let totalCost = 0;
    let totalRevenue = 0;

    cart.forEach(item => {
      totalCost += item.costPrice * item.quantity;
      totalRevenue += item.simulatedSellPrice * item.quantity;
    });

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    return {
      totalCost,
      totalRevenue,
      totalProfit,
      profitMargin
    };
  }, [cart]);

  const formatProfitCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center gap-3 uppercase tracking-tighter">
          <Calculator className="text-[#800020] w-7 h-7 sm:w-8 sm:h-8" /> Simulador
        </h2>
        <div className="text-xs font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-xl">
          Simule descontos e preços para kits
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Adicionar Produto */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Plus size={18} className="text-[#800020]" />
              Adicionar Produto
            </h3>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Selecione o Produto</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-slate-700"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                >
                  <option value="">Selecione um produto...</option>
                  {activeProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {selectedProduct && (
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex justify-between items-center">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Custo Real Un:</span>
                  <span className="text-sm font-black text-blue-700">{formatCurrency(selectedProduct.costPrice)}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quantidade</label>
                  <input 
                    type="number"
                    min="1"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Venda Simulada (R$)</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={!selectedProductId}
                className="w-full bg-[#800020] disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-900/10 hover:shadow-xl hover:shadow-red-900/20 hover:-translate-y-0.5 transition-all mt-6"
              >
                Adicionar à Simulação
              </button>
            </form>
          </div>

          {/* Dica */}
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-4">
            <div className="bg-amber-200 text-amber-700 p-2 rounded-xl mt-1">
              <HelpCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 mb-1">Como usar o Simulador?</p>
              <p className="text-[11px] font-medium text-amber-800 leading-relaxed">
                Adicione quantos produtos quiser alterando o <strong>Valor de Venda Simulada</strong> para verificar qual seria a sua margem de lucro final se montasse um kit ou desse um desconto para o cliente.
              </p>
            </div>
          </div>
        </div>

        {/* Carrinho & Resultados */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Cards de Resultado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Tag size={48} className="text-slate-900" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">Venda Total</p>
              <p className="text-2xl font-black text-slate-900 relative z-10">{formatCurrency(totals.totalRevenue)}</p>
            </div>
            
            <div className="bg-emerald-500 p-5 rounded-3xl shadow-lg shadow-emerald-500/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp size={48} className="text-white" />
              </div>
              <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1 relative z-10">Lucro Estimado</p>
              <p className="text-2xl font-black text-white relative z-10">{formatProfitCurrency(totals.totalProfit)}</p>
            </div>

            <div className="bg-[#800020] p-5 rounded-3xl shadow-lg shadow-[#800020]/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Calculator size={48} className="text-white" />
              </div>
              <p className="text-[10px] font-bold text-rose-200 uppercase tracking-widest mb-1 relative z-10">Margem Real</p>
              <p className="text-2xl font-black text-white relative z-10">{totals.profitMargin.toFixed(1)}%</p>
            </div>
          </div>

          {/* Tabela do Carrinho */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex-1">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Itens Simulados</h3>
                <p className="text-xs text-slate-400 mt-1">Custo total do kit: {formatCurrency(totals.totalCost)}</p>
              </div>
              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold">
                {cart.length} itens
              </span>
            </div>

            {cart.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-y border-slate-100 text-[10px] font-bold uppercase text-slate-400 tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Produto</th>
                      <th className="px-6 py-4 text-center">Qtd</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Venda Un.</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Total</th>
                      <th className="px-6 py-4 text-right whitespace-nowrap">Lucro</th>
                      <th className="px-6 py-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {cart.map((item) => {
                      const itemTotalCost = item.costPrice * item.quantity;
                      const itemTotalRevenue = item.simulatedSellPrice * item.quantity;
                      const itemProfit = itemTotalRevenue - itemTotalCost;
                      const isNegative = itemProfit < 0;

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-xs font-black text-slate-900 line-clamp-2">{item.productName}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Custo: {formatCurrency(item.costPrice)}/un</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-bold text-slate-600 whitespace-nowrap">
                            {formatCurrency(item.simulatedSellPrice)}
                          </td>
                          <td className="px-6 py-4 text-right text-xs font-black text-slate-900 whitespace-nowrap">
                            {formatCurrency(itemTotalRevenue)}
                          </td>
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <span className={`text-xs font-black px-2 py-1 rounded-md ${isNegative ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'}`}>
                              {formatProfitCurrency(itemProfit)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all"
                              title="Remover Item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package size={24} className="text-slate-300" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Nenhum produto adicionado</h4>
                <p className="text-xs text-slate-500">Selecione um produto ao lado para começar sua simulação.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
