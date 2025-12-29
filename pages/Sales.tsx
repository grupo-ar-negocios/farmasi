
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sale, Product, Client, Salon, SaleItem, Consignment } from '../types';
import { ShoppingCart, Plus, Trash2, Edit2, Package, X, Search, CheckCircle2 } from 'lucide-react';
import { Modal } from '../components/Modal';

interface SalesProps {
  sales: Sale[];
  products: Product[];
  clients: Client[];
  salons: Salon[];
  consignments: Consignment[];
  onAddSale: (s: Omit<Sale, 'id'>) => void;
  onEditSale: (s: Sale) => void;
  onDelete: (id: string) => void;
  startOpen?: boolean;
}

export const Sales: React.FC<SalesProps> = ({ sales, products, clients, salons, consignments, onAddSale, onEditSale, onDelete, startOpen }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const [items, setItems] = useState<SaleItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'credit' | 'debit'>('cash');
  const [saleType, setSaleType] = useState<'direct' | 'consignment'>('direct');
  const [originSalonId, setOriginSalonId] = useState('');

  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (startOpen) openModal();
  }, [startOpen]);

  const openModal = (sale?: Sale) => {
    if (sale) {
      setEditingSale(sale);
      setItems(sale.items);
      setSelectedClientId(sale.clientId);
      setPaymentMethod(sale.paymentMethod);
      setSaleType(sale.type);
      setOriginSalonId(sale.originSalonId || '');
    } else {
      setEditingSale(null);
      setItems([]);
      setSelectedClientId('');
      setPaymentMethod('cash');
      setSaleType('direct');
      setOriginSalonId('');
    }
    setProductSearch('');
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSale(null);
  };

  const baseAvailableProducts = useMemo(() => {
    if (saleType === 'direct') {
      return products.map(p => ({ ...p, displayQuantity: p.stockQuantity }));
    } else {
      if (!originSalonId) return [];
      return products.map(p => {
        const activeConsignments = consignments.filter(c => String(c.salonId) === String(originSalonId) && String(c.productId) === String(p.id));
        const totalAvailable = activeConsignments.reduce((sum, c) => sum + (c.quantity - c.soldQuantity - c.returnedQuantity), 0);
        return { ...p, displayQuantity: totalAvailable };
      });
    }
  }, [saleType, originSalonId, products, consignments]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.toLowerCase();
    // Mostra primeiros 5 produtos se não houver busca, ou filtra pela busca
    if (!term) {
      return baseAvailableProducts.slice(0, 5);
    }
    return baseAvailableProducts.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term)
    ).slice(0, 5); // Limita a 5 resultados para ficar limpo
  }, [baseAvailableProducts, productSearch]);

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setProductSearch('');
    setShowResults(false);
  };

  const addItem = () => {
    if (!selectedProduct) return;

    // Calcula a quantidade já existente no carrinho para este produto
    const existingQuantity = items
      .filter(item => item.productId === selectedProduct.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    const totalRequested = existingQuantity + itemQuantity;
    const available = (selectedProduct as any).displayQuantity ?? 0;

    if (totalRequested > available) {
      alert(`Estoque insuficiente! Disponível: ${available}${existingQuantity > 0 ? ` (já possui ${existingQuantity} no carrinho)` : ''}`);
      return;
    }

    setItems([...items, {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: itemQuantity,
      unitPrice: selectedProduct.sellPrice,
      unitCost: selectedProduct.costPrice
    }]);
    setSelectedProduct(null);
    setItemQuantity(1);
    setProductSearch('');
  };

  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));
  const calculateTotal = () => items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) { alert("Adicione ao menos um item!"); return; }

    // Validação final de estoque antes de submeter
    for (const item of items) {
      const product = baseAvailableProducts.find(p => p.id === item.productId);
      const available = product?.displayQuantity ?? 0;

      // Agrupar itens do mesmo produto no carrinho para validar o total
      const totalInCart = items
        .filter(i => i.productId === item.productId)
        .reduce((sum, i) => sum + i.quantity, 0);

      if (totalInCart > available) {
        alert(`O produto "${item.productName}" excedeu o estoque disponível (${available}). Por favor, ajuste o carrinho.`);
        return;
      }
    }

    const baseSaleData = {
      date: editingSale ? editingSale.date : new Date().toISOString(),
      clientId: selectedClientId || null,
      items: items,
      totalValue: calculateTotal(),
      totalCost: items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0),
      paymentMethod,
      type: saleType,
      originSalonId: saleType === 'consignment' ? originSalonId : undefined,
      commissionPaid: editingSale ? editingSale.commissionPaid : false
    };

    if (editingSale) {
      const updatedSale: Sale = {
        ...baseSaleData,
        id: editingSale.id,
      } as Sale;
      onEditSale(updatedSale);
    } else {
      onAddSale(baseSaleData as Omit<Sale, 'id'>);
    }
    closeModal();
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center gap-3 uppercase tracking-tighter">
          <ShoppingCart className="text-[#800020] w-7 h-7 sm:w-8 sm:h-8" /> Vendas
        </h2>
        <button onClick={() => openModal()} className="bg-[#800020] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-900/10 hover:bg-[#600018] transition-all active:scale-95 w-full sm:w-auto">
          <Plus size={18} /> Nova Venda
        </button>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[800px] sm:min-w-0">
            <thead className="bg-[#fcf8f9] text-slate-400 font-bold uppercase text-[9px] sm:text-[10px] border-b border-slate-50 tracking-widest">
              <tr>
                <th className="px-5 sm:px-8 py-4 sm:py-6 whitespace-nowrap">Data / Hora</th>
                <th className="px-5 sm:px-8 py-4 sm:py-6">Cliente</th>
                <th className="px-5 sm:px-8 py-4 sm:py-6">Produtos</th>
                <th className="px-5 sm:px-8 py-4 sm:py-6">Canal</th>
                <th className="px-5 sm:px-8 py-4 sm:py-6 text-right">Total</th>
                <th className="px-5 sm:px-8 py-4 sm:py-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sales.slice().reverse().map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-5 sm:px-8 py-4 sm:py-6 text-[11px] sm:text-xs font-bold text-slate-900 whitespace-nowrap">{new Date(sale.date).toLocaleDateString()}</td>
                  <td className="px-5 sm:px-8 py-4 sm:py-6 text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-tight whitespace-nowrap">{clients.find(c => String(c.id) === String(sale.clientId))?.name || 'Balcão'}</td>
                  <td className="px-5 sm:px-8 py-4 sm:py-6">
                    <div className="flex flex-col gap-1">
                      {sale.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[9px] font-black">{item.quantity}x</span>
                          <span className="text-[9px] font-bold text-slate-600 uppercase truncate max-w-[100px] sm:max-w-[150px]">{item.productName}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 sm:px-8 py-4 sm:py-6 whitespace-nowrap">
                    <span className={`px-3 sm:px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-tight ${sale.type === 'direct' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                      {sale.type === 'direct' ? 'Central' : 'Salão'}
                    </span>
                  </td>
                  <td className="px-5 sm:px-8 py-4 sm:py-6 text-right font-bold text-[13px] sm:text-sm text-slate-950 whitespace-nowrap">R$ {sale.totalValue.toFixed(2)}</td>
                  <td className="px-5 sm:px-8 py-4 sm:py-6 text-center">
                    <div className="flex justify-center gap-1 sm:gap-3 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(sale)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => { if (confirm("Confirmar exclusão desta venda?")) onDelete(sale.id); }} className="p-2 text-[#800020] hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingSale ? "Editar Venda" : "Nova Venda"}>
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            <div className="space-y-4">
              <label className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 sm:mb-3">Origem da Transação</label>
              <div className="flex gap-3 sm:gap-4">
                <label className={`flex-1 flex items-center justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${saleType === 'direct' ? 'border-[#800020] bg-[#800020] text-white shadow-md' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                  <input type="radio" checked={saleType === 'direct'} onChange={() => { setSaleType('direct'); setSelectedProduct(null); }} className="hidden" />
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Estoque Direto</span>
                </label>
                <label className={`flex-1 flex items-center justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer ${saleType === 'consignment' ? 'border-[#800020] bg-[#800020] text-white shadow-md' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                  <input type="radio" checked={saleType === 'consignment'} onChange={() => { setSaleType('consignment'); setSelectedProduct(null); }} className="hidden" />
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">Entrega Salão</span>
                </label>
              </div>
              {saleType === 'consignment' && (
                <select required className="w-full p-4 border border-slate-100 bg-slate-50 text-slate-900 font-bold text-[10px] sm:text-[11px] uppercase rounded-xl sm:rounded-2xl outline-none focus:bg-white focus:border-[#800020]/20 transition-all" value={originSalonId} onChange={e => { setOriginSalonId(e.target.value); setSelectedProduct(null); }}>
                  <option value="">Selecione o Salão</option>
                  {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
            <div className="space-y-4">
              <label className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 sm:mb-3">Pagamento & Cliente</label>
              <select className="w-full p-4 border border-slate-100 bg-slate-50 text-slate-900 font-bold text-[10px] sm:text-[11px] uppercase rounded-xl sm:rounded-2xl outline-none focus:bg-white focus:border-[#800020]/20 transition-all" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
                <option value="">Venda Direta (Sem Cliente)</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="w-full p-4 border border-slate-100 bg-slate-50 text-slate-900 font-bold text-[10px] sm:text-[11px] uppercase rounded-xl sm:rounded-2xl outline-none focus:bg-white focus:border-[#800020]/20 transition-all" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
                <option value="cash">Dinheiro / Espécie</option>
                <option value="pix">PIX</option>
                <option value="debit">Débito</option>
                <option value="credit">Crédito</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-slate-100 space-y-6 relative">
            <div className="space-y-4">
              <label className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 sm:mb-4">Adicionar ao Carrinho</label>

              {selectedProduct ? (
                <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm animate-in zoom-in duration-300 gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <CheckCircle2 className="text-[#D4AF37] w-5 h-5 sm:w-6 sm:h-6" />
                    <div>
                      <p className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirmar Item</p>
                      <p className="text-[12px] sm:text-sm font-bold text-slate-900 uppercase tracking-tight line-clamp-1">{selectedProduct.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase mb-1">Qtd</span>
                      <input type="number" min="1" className="w-14 sm:w-16 p-2 bg-slate-50 border border-slate-100 rounded-lg text-center font-bold text-sm outline-none focus:border-[#800020]/20" value={itemQuantity} onChange={e => setItemQuantity(Number(e.target.value))} />
                    </div>
                    <button type="button" onClick={addItem} className="bg-[#800020] text-white px-5 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold uppercase text-[9px] sm:text-[10px] tracking-widest hover:bg-[#600018] transition-all shadow-md shadow-red-900/10 flex-1 sm:flex-none">Adicionar</button>
                    <button type="button" onClick={() => setSelectedProduct(null)} className="text-slate-300 hover:text-[#800020] transition-colors p-1"><X size={20} /></button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-[16px] sm:h-[16px]" />
                    <input
                      type="text"
                      placeholder="BUSCAR NO CATÁLOGO..."
                      className="w-full pl-12 sm:pl-14 pr-4 py-4 sm:py-5 bg-white border border-slate-100 rounded-xl sm:rounded-2xl text-[10px] sm:text-[11px] font-bold uppercase tracking-wider outline-none focus:border-[#800020]/30 transition-all shadow-sm"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowResults(true);
                      }}
                      onFocus={() => setShowResults(true)}
                    />
                  </div>

                  {showResults && filteredProducts.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[250px] overflow-y-auto custom-scrollbar">
                      {filteredProducts.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProduct(p as any)}
                          className="w-full text-left p-4 sm:p-5 hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 group transition-colors"
                        >
                          <div className="max-w-[70%]">
                            <p className="text-[10px] sm:text-[11px] font-bold text-slate-800 uppercase group-hover:text-[#800020] transition-colors line-clamp-1">{p.name}</p>
                            <p className="text-[8px] sm:text-[9px] font-medium text-slate-400 uppercase tracking-tighter mt-0.5">Ref: {p.code} • R$ {p.sellPrice.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-[7px] sm:text-[8px] font-bold px-2 sm:px-3 py-1 rounded-full uppercase tracking-tighter ${p.displayQuantity <= 0 ? 'bg-red-50 text-[#800020]' : 'bg-slate-50 text-slate-600'}`}>
                              {p.displayQuantity <= 0 ? 'Off' : `${p.displayQuantity} un`}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showResults && productSearch.length > 2 && filteredProducts.length === 0 && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border-2 border-rose-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-center shadow-2xl">
                      <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Nenhum produto encontrado...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3 sm:space-y-4 pt-4 border-t border-slate-100">
              <label className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 sm:mb-4">Itens Selecionados</label>
              {items.length === 0 && (
                <div className="py-6 sm:py-10 text-center border border-dashed border-slate-200 rounded-xl sm:rounded-[2rem] bg-white/50">
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-widest">Carrinho vazio</p>
                </div>
              )}
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-left-4 duration-300 group">
                  <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    <div className="bg-slate-50 p-2 sm:p-2.5 rounded-lg sm:rounded-xl text-slate-900 font-bold text-[10px] sm:text-[11px] border border-slate-100 shrink-0">{item.quantity}x</div>
                    <span className="font-bold text-[11px] sm:text-xs uppercase text-slate-800 tracking-tight truncate">{item.productName}</span>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 tracking-tighter">R$ {(item.unitPrice * item.quantity).toFixed(2)}</span>
                    <button type="button" onClick={() => removeItem(idx)} className="text-slate-300 hover:text-[#800020] transition-all hover:scale-110 p-1"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-4 sm:pt-8 bg-white sm:bg-transparent -mx-5 -mb-5 p-5 sm:m-0 sm:p-0 border-t sm:border-0">
            <div className="text-center sm:text-left">
              <span className="font-bold text-slate-400 uppercase text-[9px] sm:text-[10px] tracking-widest block mb-1">Total da Venda</span>
              <span className="font-black text-3xl sm:text-5xl text-slate-950 tracking-tighter leading-none">R$ {calculateTotal().toFixed(2)}</span>
            </div>
            <button type="submit" className="bg-[#800020] text-white px-10 sm:px-14 py-4 sm:py-6 rounded-2xl sm:rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] sm:text-[11px] hover:bg-[#600018] shadow-xl shadow-red-900/20 transition-all hover:-translate-y-1 w-full sm:w-auto">
              {editingSale ? 'Atualizar' : 'Finalizar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
