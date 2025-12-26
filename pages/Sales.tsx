
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
  onAddSale: (s: Sale) => void;
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
    const saleData: Sale = {
      id: editingSale ? editingSale.id : Date.now().toString(),
      date: editingSale ? editingSale.date : new Date().toISOString(),
      clientId: selectedClientId || 'Anônimo',
      items: items,
      totalValue: calculateTotal(),
      totalCost: items.reduce((acc, item) => acc + (item.quantity * item.unitCost), 0),
      paymentMethod,
      type: saleType,
      originSalonId: saleType === 'consignment' ? originSalonId : undefined,
      commissionPaid: editingSale ? editingSale.commissionPaid : false
    };

    if (editingSale) onEditSale(saleData);
    else onAddSale(saleData);
    closeModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-950 flex items-center gap-3 uppercase">
          <ShoppingCart className="text-rose-500" size={32} /> Vendas
        </h2>
        <button onClick={() => openModal()} className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-2xl shadow-rose-200 hover:scale-105 active:scale-95 transition-all">
          <Plus size={20} /> Nova Venda
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-rose-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#fffafa] text-slate-500 font-black uppercase text-[11px] border-b border-rose-100">
              <tr>
                <th className="p-6">Data</th>
                <th className="p-6">Cliente</th>
                <th className="p-6">Tipo</th>
                <th className="p-6 text-right">Valor</th>
                <th className="p-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-50">
              {sales.slice().reverse().map(sale => (
                <tr key={sale.id} className="hover:bg-rose-50/20 transition-colors">
                  <td className="p-6 text-xs font-bold text-slate-950">{new Date(sale.date).toLocaleDateString()}</td>
                  <td className="p-6 text-xs font-black text-slate-950 uppercase">{clients.find(c => String(c.id) === String(sale.clientId))?.name || 'Balcão'}</td>
                  <td className="p-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${sale.type === 'direct' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {sale.type === 'direct' ? 'Estoque' : 'Salão'}
                    </span>
                  </td>
                  <td className="p-6 text-right font-black text-sm text-slate-950">R$ {sale.totalValue.toFixed(2)}</td>
                  <td className="p-6 text-center">
                    <div className="flex justify-center gap-4">
                      <button onClick={() => openModal(sale)} className="text-blue-600 hover:scale-110 transition-transform"><Edit2 size={20} /></button>
                      <button onClick={() => { if (confirm("Confirmar exclusão desta venda?")) onDelete(sale.id); }} className="text-rose-600 hover:scale-110 transition-transform"><Trash2 size={20} /></button>
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
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Origem da Venda</label>
              <div className="flex gap-4">
                <label className={`flex-1 flex items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${saleType === 'direct' ? 'border-slate-950 bg-slate-950 text-white' : 'border-rose-100 bg-[#fffafa] text-slate-950'}`}>
                  <input type="radio" checked={saleType === 'direct'} onChange={() => { setSaleType('direct'); setSelectedProduct(null); }} className="hidden" />
                  <span className="text-[11px] font-black uppercase">Depósito</span>
                </label>
                <label className={`flex-1 flex items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${saleType === 'consignment' ? 'border-slate-950 bg-slate-950 text-white' : 'border-rose-100 bg-[#fffafa] text-slate-950'}`}>
                  <input type="radio" checked={saleType === 'consignment'} onChange={() => { setSaleType('consignment'); setSelectedProduct(null); }} className="hidden" />
                  <span className="text-[11px] font-black uppercase">Salão</span>
                </label>
              </div>
              {saleType === 'consignment' && (
                <select required className="w-full p-4 border-2 border-rose-50 bg-[#fffafa] text-slate-950 font-black text-xs uppercase rounded-2xl outline-none focus:border-rose-400" value={originSalonId} onChange={e => { setOriginSalonId(e.target.value); setSelectedProduct(null); }}>
                  <option value="">Selecione o Salão Parceiro</option>
                  {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              )}
            </div>
            <div className="space-y-4">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Cliente & Pagamento</label>
              <select className="w-full p-4 border-2 border-rose-50 bg-[#fffafa] text-slate-950 font-black text-xs uppercase rounded-2xl outline-none focus:border-rose-400" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
                <option value="">Consumidor Final (Balcão)</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="w-full p-4 border-2 border-rose-50 bg-[#fffafa] text-slate-950 font-black text-xs uppercase rounded-2xl outline-none focus:border-rose-400" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
                <option value="cash">Dinheiro</option>
                <option value="pix">PIX</option>
                <option value="debit">Cartão de Débito</option>
                <option value="credit">Cartão de Crédito</option>
              </select>
            </div>
          </div>

          <div className="bg-[#fffafa] p-8 rounded-[2rem] border-2 border-rose-50 space-y-6 relative">
            <div className="space-y-4">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Adicionar Itens</label>

              {selectedProduct ? (
                <div className="flex items-center justify-between bg-white p-5 rounded-2xl border-2 border-rose-500 animate-in zoom-in duration-300">
                  <div className="flex items-center gap-4">
                    <CheckCircle2 className="text-rose-500" size={24} />
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Item Selecionado</p>
                      <p className="text-sm font-black text-slate-950 uppercase">{selectedProduct.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-black text-slate-400 uppercase">Quantidade</span>
                      <input type="number" min="1" className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-black text-sm outline-none" value={itemQuantity} onChange={e => setItemQuantity(Number(e.target.value))} />
                    </div>
                    <button type="button" onClick={addItem} className="bg-slate-950 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] hover:bg-black transition-all">Incluir</button>
                    <button type="button" onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-rose-500"><X size={20} /></button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400" size={18} />
                    <input
                      type="text"
                      placeholder="DIGITE O NOME OU CÓDIGO DO PRODUTO..."
                      className="w-full pl-12 pr-4 py-4 bg-white border-2 border-rose-100 rounded-2xl text-[11px] font-black uppercase tracking-wider outline-none focus:border-rose-400 shadow-sm"
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
                    <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border-2 border-rose-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {filteredProducts.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProduct(p as any)}
                          className="w-full text-left p-4 hover:bg-rose-50 flex items-center justify-between border-b border-rose-50 last:border-0 group"
                        >
                          <div>
                            <p className="text-xs font-black text-slate-950 uppercase group-hover:text-rose-500 transition-colors">{p.name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Cód: {p.code} • Valor: R$ {p.sellPrice.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-[9px] font-black px-2 py-1 rounded-full uppercase ${p.displayQuantity <= 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                              {p.displayQuantity <= 0 ? 'Sem Estoque' : `${p.displayQuantity} un`}
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

            <div className="space-y-3 pt-4">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Itens no Carrinho</label>
              {items.length === 0 && (
                <div className="py-6 text-center border-2 border-dashed border-rose-100 rounded-2xl">
                  <p className="text-[10px] font-black text-slate-300 uppercase">Seu carrinho está vazio</p>
                </div>
              )}
              {items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white p-5 rounded-2xl border border-rose-50 shadow-sm animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="bg-rose-50 p-2 rounded-lg text-rose-500 font-black text-[10px]">{item.quantity}x</div>
                    <span className="font-black text-sm uppercase text-slate-950">{item.productName}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="font-black text-sm text-slate-950 tracking-tight">R$ {(item.unitPrice * item.quantity).toFixed(2)}</span>
                    <button type="button" onClick={() => removeItem(idx)} className="text-rose-500 hover:scale-125 transition-transform"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-8 border-t border-rose-100">
            <div>
              <span className="font-black text-slate-400 uppercase text-[12px] tracking-widest block">Total a Pagar</span>
              <span className="font-black text-5xl text-slate-950 tracking-tighter">R$ {calculateTotal().toFixed(2)}</span>
            </div>
            <button type="submit" className="bg-rose-500 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-rose-600 shadow-2xl shadow-rose-200 transition-all active:scale-95">
              {editingSale ? 'Atualizar Venda' : 'Finalizar Pedido'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
