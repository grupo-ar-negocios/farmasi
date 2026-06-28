
import React, { useState, useEffect, useMemo } from 'react';
import { Consignment, Salon, Product } from '../types';
import { Handshake, Plus, ArrowRight, Edit2, Trash2, Search, X, CheckCircle2 } from 'lucide-react';
import { Modal } from '../components/Modal';

interface ConsignmentsProps {
  consignments: Consignment[];
  salons: Salon[];
  products: Product[];
  onAdd: (consignments: Omit<Consignment, 'id'>[]) => void;
  onEdit: (c: Consignment) => void;
  onDelete: (id: string) => void;
  startOpen?: boolean;
}

export const Consignments: React.FC<ConsignmentsProps> = ({ consignments, salons, products, onAdd, onEdit, onDelete, startOpen }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConsignment, setEditingConsignment] = useState<Consignment | null>(null);

  const [salonId, setSalonId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  interface ConsignmentItem {
    productId: string;
    productName: string;
    quantity: number;
  }

  const [items, setItems] = useState<ConsignmentItem[]>([]);

  useEffect(() => {
    if (startOpen) openModal();
  }, [startOpen]);

  const openModal = (consignment?: Consignment) => {
    if (consignment) {
      setEditingConsignment(consignment);
      setSalonId(consignment.salonId);
      const prod = products.find(p => String(p.id) === String(consignment.productId));
      setSelectedProduct(prod || null);
      setQuantity(consignment.quantity);
      setItems([]);
    } else {
      setEditingConsignment(null);
      setSalonId('');
      setSelectedProduct(null);
      setQuantity(1);
      setItems([]);
    }
    setProductSearch('');
    setIsModalOpen(true);
  };

  const filteredProducts = useMemo(() => {
    const term = productSearch.toLowerCase();
    // Mostra primeiros 5 produtos se não houver busca, ou filtra pela busca
    if (!term) {
      return products.slice(0, 5);
    }
    return products.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term)
    ).slice(0, 10);
  }, [products, productSearch]);

  const filteredConsignments = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return consignments;
    return consignments.filter(c => {
      const product = products.find(p => String(p.id) === String(c.productId));
      return product?.name.toLowerCase().includes(term);
    });
  }, [consignments, products, searchTerm]);

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setProductSearch('');
    setShowResults(false);
  };

  const addItem = () => {
    if (!selectedProduct) return;

    const existingQuantity = items
      .filter(item => item.productId === selectedProduct.id)
      .reduce((sum, item) => sum + item.quantity, 0);

    const totalRequested = existingQuantity + quantity;
    const available = selectedProduct.stockQuantity;

    if (totalRequested > available) {
      alert(`Estoque insuficiente! Disponível: ${available}${existingQuantity > 0 ? ` (já possui ${existingQuantity} no carrinho)` : ''}`);
      return;
    }

    setItems([...items, {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity: quantity
    }]);
    setSelectedProduct(null);
    setQuantity(1);
    setProductSearch('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingConsignment) {
      if (!selectedProduct) return;

      const qtyDiff = quantity - editingConsignment.quantity;
      if (selectedProduct.stockQuantity < qtyDiff) {
        alert(`Estoque insuficiente! Disponível: ${selectedProduct.stockQuantity + editingConsignment.quantity} un`);
        return;
      }

      const updatedConsignment: Consignment = {
        id: editingConsignment.id,
        salonId,
        productId: selectedProduct.id,
        quantity,
        soldQuantity: editingConsignment.soldQuantity,
        returnedQuantity: editingConsignment.returnedQuantity,
        status: editingConsignment.status,
        date: editingConsignment.date
      };
      onEdit(updatedConsignment);
      setIsModalOpen(false);
    } else {
      if (items.length === 0) {
        alert("Adicione pelo menos um produto!");
        return;
      }

      const consignmentsList = items.map(item => ({
        salonId,
        productId: item.productId,
        quantity: item.quantity,
        soldQuantity: 0,
        returnedQuantity: 0,
        status: 'active' as const,
        date: new Date().toISOString()
      }));

      onAdd(consignmentsList);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center gap-3 uppercase tracking-tighter">
          <Handshake className="text-[#800020] w-7 h-7 sm:w-8 sm:h-8 shrink-0" /> Consignações
        </h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <label className="flex items-center gap-3 bg-white border border-slate-100 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-sm text-slate-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest w-full sm:w-auto">
            <Search className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" />
            <input
              type="text"
              placeholder="Filtro por produto..."
              className="outline-none placeholder:text-slate-300 text-slate-900 flex-1 sm:w-48 bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
          <button onClick={() => openModal()} className="bg-[#800020] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-900/10 hover:bg-[#600018] transition-all active:scale-95 w-full sm:w-auto">
            <Plus size={18} className="shrink-0" /> Novo Envio
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[900px] lg:min-w-0">
            <thead className="bg-[#fcf8f9] text-slate-400 font-bold uppercase text-[9px] sm:text-[10px] border-b border-slate-50 tracking-widest">
              <tr>
                <th className="px-5 sm:px-8 py-4 sm:py-6">Data</th>
                <th className="px-5 sm:px-8 py-4 sm:py-6">Salão Parceiro</th>
                <th className="px-5 sm:px-8 py-4 sm:py-6">Produto</th>
                <th className="px-5 sm:px-8 py-4 sm:py-6 text-center">Quantidades</th>
                <th className="px-5 sm:px-8 py-4 sm:py-6 text-center">Status</th>
                <th className="px-5 sm:px-8 py-4 sm:py-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredConsignments.map(c => {
                const salon = salons.find(s => String(s.id) === String(c.salonId));
                const product = products.find(p => String(p.id) === String(c.productId));
                const remaining = c.quantity - c.soldQuantity - c.returnedQuantity;

                return (
                  <tr key={c.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-5 sm:px-8 py-4 sm:py-5 text-slate-950 font-bold text-[11px] sm:text-xs uppercase">{new Date(c.date).toLocaleDateString()}</td>
                    <td className="px-5 sm:px-8 py-4 sm:py-5 text-slate-950 font-bold text-[11px] sm:text-xs uppercase">{salon?.name}</td>
                    <td className="px-5 sm:px-8 py-4 sm:py-5 text-slate-950 font-bold text-[11px] sm:text-xs uppercase">{product?.name}</td>
                    <td className="px-5 sm:px-8 py-4 sm:py-5 text-center">
                      <div className="inline-flex items-center gap-2 bg-[#fffafa] border border-slate-100 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[8px] sm:text-[10px] font-black uppercase">
                        <span className="text-slate-400">Tot:</span>
                        <span className="text-slate-950">{c.quantity}</span>
                        <span className="text-slate-400">| Ven:</span>
                        <span className="text-emerald-600">{c.soldQuantity}</span>
                        <span className="text-slate-400">| Sal:</span>
                        <span className="text-[#800020]">{remaining}</span>
                      </div>
                    </td>
                    <td className="px-5 sm:px-8 py-4 sm:py-5 text-center">
                      <span className="inline-flex items-center gap-1.5 sm:gap-2 bg-emerald-50 text-emerald-600 text-[8px] sm:text-[10px] font-black uppercase px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                        <CheckCircle2 size={12} className="shrink-0" /> Aberto
                      </span>
                    </td>
                    <td className="px-5 sm:px-8 py-4 sm:py-5 text-center">
                      <div className="flex items-center justify-center gap-1 sm:gap-3 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(c)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit2 size={14} className="shrink-0" /></button>
                        <button onClick={() => { if (confirm("Excluir consignado?")) onDelete(c.id); }} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={14} className="shrink-0" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingConsignment ? "Editar Consignado" : "Enviar Consignado"}>
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div>
            <label className="block text-[10px] sm:text-[11px] font-black text-slate-500 uppercase mb-2 tracking-widest">Salão Parceiro</label>
            <select 
              required 
              disabled={!!editingConsignment}
              className="w-full p-4 bg-[#fffafa] border-2 border-slate-100 rounded-xl sm:rounded-2xl text-slate-950 font-black text-[11px] sm:text-xs uppercase outline-none focus:border-[#800020] transition-all disabled:opacity-60" 
              value={salonId} 
              onChange={e => setSalonId(e.target.value)}
            >
              <option value="">Selecione o Salão...</option>
              {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {editingConsignment ? (
            /* Edição de Consignação Individual */
            <>
              <div>
                <label className="block text-[10px] sm:text-[11px] font-black text-slate-500 uppercase mb-2 tracking-widest">Produto</label>
                <div className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl text-slate-950 font-black text-[11px] sm:text-xs uppercase">
                  {selectedProduct?.name}
                </div>
              </div>
              <div>
                <label className="block text-[10px] sm:text-[11px] font-black text-slate-500 uppercase mb-2 tracking-widest">Quantidade</label>
                <input required type="number" min="1" className="w-full p-4 bg-[#fffafa] border-2 border-slate-100 rounded-xl sm:rounded-2xl text-slate-950 font-black text-sm outline-none focus:border-[#800020] focus:bg-white transition-all" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
              </div>
              <button type="submit" disabled={!selectedProduct || !salonId || quantity <= 0} className="w-full bg-slate-950 text-white py-4 sm:py-5 rounded-xl sm:rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] sm:text-[11px] hover:bg-black mt-4 shadow-xl hover:shadow-2xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50">
                Salvar Alterações
              </button>
            </>
          ) : (
            /* Envio de Múltiplos Consignados (Carrinho) */
            <>
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 space-y-4">
                <label className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Adicionar ao Envio</label>
                
                {selectedProduct ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm animate-in zoom-in duration-300 gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
                      <CheckCircle2 className="text-[#800020] shrink-0 w-5 h-5" />
                      <div className="overflow-hidden">
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Confirmar Produto</p>
                        <p className="text-[11px] sm:text-xs font-bold text-slate-950 uppercase truncate">{selectedProduct.name}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase">Estoque: {selectedProduct.stockQuantity} un</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                      <div className="flex flex-col items-center">
                        <span className="text-[8px] font-bold text-slate-400 uppercase mb-1">Qtd</span>
                        <input type="number" min="1" className="w-14 sm:w-16 p-2 bg-slate-50 border border-slate-100 rounded-lg text-center font-bold text-sm outline-none focus:border-[#800020]/20" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
                      </div>
                      <button type="button" onClick={addItem} className="bg-[#800020] text-white px-4 sm:px-6 py-2 rounded-lg font-bold uppercase text-[9px] sm:text-[10px] tracking-widest hover:bg-[#600018] transition-all shadow-md">Adicionar</button>
                      <button type="button" onClick={() => setSelectedProduct(null)} className="text-slate-300 hover:text-[#800020] p-1"><X size={20} className="shrink-0" /></button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 shrink-0" />
                      <input
                        type="text"
                        placeholder="BUSCAR PRODUTO..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-xl text-[10px] sm:text-[11px] font-bold uppercase tracking-wider outline-none focus:border-[#800020]/30 transition-all shadow-sm"
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setShowResults(true);
                        }}
                        onFocus={() => setShowResults(true)}
                      />
                    </div>

                    {showResults && filteredProducts.length > 0 && (
                      <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 max-h-[200px] overflow-y-auto custom-scrollbar">
                        {filteredProducts.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectProduct(p)}
                            className="w-full text-left p-3 hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 group transition-colors"
                          >
                            <div className="max-w-[75%]">
                              <p className="text-[10px] sm:text-[11px] font-bold text-slate-800 uppercase group-hover:text-[#800020] transition-colors truncate">{p.name}</p>
                              <p className="text-[8px] font-medium text-slate-400 uppercase mt-0.5">Ref: {p.code} • Estoque: {p.stockQuantity} un</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Produtos Selecionados</label>
                {items.length === 0 && (
                  <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl bg-white/50">
                    <p className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-widest">Nenhum produto adicionado</p>
                  </div>
                )}
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-slate-50 px-2 py-1 rounded text-slate-900 font-bold text-[10px] border border-slate-100 shrink-0">{item.quantity}x</div>
                      <span className="font-bold text-[11px] sm:text-xs uppercase text-slate-800 tracking-tight truncate">{item.productName}</span>
                    </div>
                    <button type="button" onClick={() => removeItem(idx)} className="text-slate-300 hover:text-[#800020] transition-all hover:scale-110 p-1"><Trash2 size={16} className="shrink-0" /></button>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={items.length === 0 || !salonId} className="w-full bg-slate-950 text-white py-4 sm:py-5 rounded-xl sm:rounded-[2rem] font-black uppercase tracking-[0.2em] text-[10px] sm:text-[11px] hover:bg-black mt-4 shadow-xl hover:shadow-2xl shadow-slate-200 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100">
                Confirmar Envio ({items.length})
              </button>
            </>
          )}
        </form>
      </Modal>
    </div>
  );
};
