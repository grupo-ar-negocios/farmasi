
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-950 flex items-center gap-3 uppercase tracking-tighter">
          <ShoppingCart className="text-[#800020]" size={32} /> Vendas
        </h2>
        <button onClick={() => openModal()} className="bg-[#800020] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg shadow-red-900/10 hover:bg-[#600018] transition-all active:scale-95">
          <Plus size={18} /> Nova Venda
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#fcf8f9] text-slate-400 font-bold uppercase text-[10px] border-b border-slate-50 tracking-widest">
              <tr>
                <th className="px-8 py-6">Timestamp</th>
                <th className="px-8 py-6">Customer</th>
                <th className="px-8 py-6">Channel</th>
                <th className="px-8 py-6 text-right">Revenue</th>
                <th className="px-8 py-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sales.slice().reverse().map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6 text-xs font-bold text-slate-900">{new Date(sale.date).toLocaleDateString()}</td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-900 uppercase tracking-tight">{clients.find(c => String(c.id) === String(sale.clientId))?.name || 'Balcão'}</td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${sale.type === 'direct' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                      {sale.type === 'direct' ? 'Warehouse' : 'Salon Delivery'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right font-bold text-sm text-slate-950">R$ {sale.totalValue.toFixed(2)}</td>
                  <td className="px-8 py-6 text-center text-slate-300">
                    <div className="flex justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
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
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Origem da Transação</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center p-4 rounded-2xl border transition-all ${saleType === 'direct' ? 'border-[#800020] bg-[#800020] text-white shadow-md' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                  <input type="radio" checked={saleType === 'direct'} onChange={() => { setSaleType('direct'); setSelectedProduct(null); }} className="hidden" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Inventory</span>
                </label>
                <label className={`flex-1 flex items-center justify-center p-4 rounded-2xl border transition-all ${saleType === 'consignment' ? 'border-[#800020] bg-[#800020] text-white shadow-md' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                  <input type="radio" checked={saleType === 'consignment'} onChange={() => { setSaleType('consignment'); setSelectedProduct(null); }} className="hidden" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Partnership</span>
                </label>
              </div>
              {saleType === 'consignment' && (
                <select required className="w-full p-4 border border-slate-100 bg-slate-50 text-slate-900 font-bold text-[11px] uppercase rounded-2xl outline-none focus:bg-white focus:border-[#800020]/20 transition-all" value={originSalonId} onChange={e => { setOriginSalonId(e.target.value); setSelectedProduct(null); }}>
                  <option value="">Select Partner Salon</option>
                  {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Payment Info</label>
              <select className="w-full p-4 border border-slate-100 bg-slate-50 text-slate-900 font-bold text-[11px] uppercase rounded-2xl outline-none focus:bg-white focus:border-[#800020]/20 transition-all" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
                <option value="">Individual (Guest checkout)</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="w-full p-4 border border-slate-100 bg-slate-50 text-slate-900 font-bold text-[11px] uppercase rounded-2xl outline-none focus:bg-white focus:border-[#800020]/20 transition-all" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
                <option value="cash">Direct Cash</option>
                <option value="pix">Instant Transfer (PIX)</option>
                <option value="debit">Debit Account</option>
                <option value="credit">Credit Installments</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6 relative">
            <div className="space-y-4">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Cart Logic</label>

              {selectedProduct ? (
                <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-in zoom-in duration-300">
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="text-[#D4AF37]" size={24} />
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ready to add</p>
                      <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{selectedProduct.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-bold text-slate-400 uppercase mb-2">Quantity</span>
                      <input type="number" min="1" className="w-16 p-2 bg-slate-50 border border-slate-100 rounded-lg text-center font-bold text-sm outline-none focus:border-[#800020]/20" value={itemQuantity} onChange={e => setItemQuantity(Number(e.target.value))} />
                    </div>
                    <button type="button" onClick={addItem} className="bg-[#800020] text-white px-8 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-[#600018] transition-all shadow-md shadow-red-900/10">Add item</button>
                    <button type="button" onClick={() => setSelectedProduct(null)} className="text-slate-300 hover:text-[#800020] transition-colors"><X size={20} /></button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="SEARCH PRODUCT CATALOG..."
                      className="w-full pl-14 pr-4 py-5 bg-white border border-slate-100 rounded-2xl text-[11px] font-bold uppercase tracking-wider outline-none focus:border-[#800020]/30 transition-all shadow-sm"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        setShowResults(true);
                      }}
                      onFocus={() => setShowResults(true)}
                    />
                  </div>

                  {/* Lista de Resultados Integrada */}
                  {showResults && filteredProducts.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {filteredProducts.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProduct(p as any)}
                          className="w-full text-left p-5 hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 group transition-colors"
                        >
                          <div>
                            <p className="text-[11px] font-bold text-slate-800 uppercase group-hover:text-[#800020] transition-colors">{p.name}</p>
                            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter mt-1">Ref: {p.code} • R$ {p.sellPrice.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-[8px] font-bold px-3 py-1 rounded-full uppercase tracking-tighter ${p.displayQuantity <= 0 ? 'bg-red-50 text-[#800020]' : 'bg-slate-50 text-slate-600'}`}>
                              {p.displayQuantity <= 0 ? 'Out of stock' : `${p.displayQuantity} in stock`}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showResults && productSearch.length > 2 && filteredProducts.length === 0 && (
                    <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border-2 border-rose-100 rounded-2xl p-6 text-center shadow-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Nenhum produto encontrado...</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Current Selection</label>
              {items.length === 0 && (
                <div className="py-10 text-center border border-dashed border-slate-200 rounded-[2rem] bg-white/50">
                  <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Bag is empty</p>
                </div>
              )}
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-left-4 duration-300 group">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-50 p-2.5 rounded-xl text-slate-900 font-bold text-[11px] border border-slate-100">{item.quantity}x</div>
                    <span className="font-bold text-xs uppercase text-slate-800 tracking-tight">{item.productName}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-bold text-sm text-slate-900 tracking-tighter">R$ {(item.unitPrice * item.quantity).toFixed(2)}</span>
                    <button type="button" onClick={() => removeItem(idx)} className="text-slate-300 hover:text-[#800020] transition-all hover:scale-110"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-8">
            <div>
              <span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest block mb-2">Order Value</span>
              <span className="font-black text-5xl text-slate-950 tracking-tighter">R$ {calculateTotal().toFixed(2)}</span>
            </div>
            <button type="submit" className="bg-[#800020] text-white px-14 py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] hover:bg-[#600018] shadow-xl shadow-red-900/20 transition-all hover:-translate-y-1">
              {editingSale ? 'Update Order' : 'Complete Transaction'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
