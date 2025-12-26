
import React, { useState, useEffect, useMemo } from 'react';
import { Consignment, Salon, Product } from '../types';
import { Handshake, Plus, ArrowRight, Edit2, Trash2, Search, X, CheckCircle2 } from 'lucide-react';
import { Modal } from '../components/Modal';

interface ConsignmentsProps {
  consignments: Consignment[];
  salons: Salon[];
  products: Product[];
  onAdd: (c: Consignment) => void;
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
    } else {
      setEditingConsignment(null);
      setSalonId('');
      setSelectedProduct(null);
      setQuantity(1);
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
    ).slice(0, 5);
  }, [products, productSearch]);

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setProductSearch('');
    setShowResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const newConsignment: Consignment = {
      id: editingConsignment ? editingConsignment.id : Date.now().toString(),
      salonId,
      productId: selectedProduct.id,
      quantity,
      soldQuantity: editingConsignment ? editingConsignment.soldQuantity : 0,
      returnedQuantity: editingConsignment ? editingConsignment.returnedQuantity : 0,
      status: editingConsignment ? editingConsignment.status : 'active',
      date: editingConsignment ? editingConsignment.date : new Date().toISOString()
    };

    if (editingConsignment) onEdit(newConsignment);
    else onAdd(newConsignment);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-950 flex items-center gap-3 uppercase">
          <Handshake className="text-rose-500" size={32} /> Consignados
        </h2>
        <button onClick={() => openModal()} className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:bg-black transition-all shadow-lg shadow-rose-100">
          <Plus size={20} /> Novo Consignado
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {consignments.filter(c => c.status === 'active').map(c => {
          const salon = salons.find(s => String(s.id) === String(c.salonId));
          const product = products.find(p => String(p.id) === String(c.productId));
          const remaining = c.quantity - c.soldQuantity - c.returnedQuantity;

          return (
            <div key={c.id} className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm relative group">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openModal(c)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit2 size={14} /></button>
                <button onClick={() => { if (confirm("Excluir consignado?")) onDelete(c.id); }} className="p-2 bg-rose-50 text-rose-600 rounded-lg"><Trash2 size={14} /></button>
              </div>
              <div className="mb-4">
                <h3 className="font-black text-slate-950 uppercase text-sm mb-1">{salon?.name}</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(c.date).toLocaleDateString()}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-950">
                  <ArrowRight size={14} className="text-rose-400" />
                  <span className="font-black text-xs uppercase">{product?.name}</span>
                </div>
                <div className="bg-[#fffafa] p-4 rounded-2xl border border-rose-50 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase block">Total</span>
                    <span className="text-xs font-black text-slate-950">{c.quantity}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase block">Vendidos</span>
                    <span className="text-xs font-black text-emerald-600">{c.soldQuantity}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase block">Saldo</span>
                    <span className="text-xs font-black text-rose-500">{remaining}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingConsignment ? "Editar Consignado" : "Enviar Consignado"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase mb-2 tracking-widest">Salão Parceiro</label>
            <select required className="w-full p-4 bg-[#fffafa] border-2 border-rose-100 rounded-2xl text-slate-950 font-black text-xs uppercase outline-none focus:border-rose-400" value={salonId} onChange={e => setSalonId(e.target.value)}>
              <option value="">Selecione o Salão...</option>
              {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="space-y-4">
            <label className="block text-[11px] font-black text-slate-500 uppercase mb-2 tracking-widest">Produto para Envio</label>

            {selectedProduct ? (
              <div className="flex items-center justify-between bg-white p-5 rounded-2xl border-2 border-rose-500 animate-in zoom-in duration-300 shadow-sm">
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="text-rose-500" size={24} />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selecionado</p>
                    <p className="text-sm font-black text-slate-950 uppercase">{selectedProduct.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Em Estoque: {selectedProduct.stockQuantity} un</p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-rose-500 p-2"><X size={20} /></button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400" size={18} />
                  <input
                    type="text"
                    placeholder="PESQUISAR PRODUTO NO ESTOQUE..."
                    className="w-full pl-12 pr-4 py-4 bg-[#fffafa] border-2 border-rose-100 rounded-2xl text-[11px] font-black uppercase tracking-wider outline-none focus:border-rose-400 focus:bg-white"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowResults(true);
                    }}
                  />
                </div>

                {showResults && filteredProducts.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border-2 border-rose-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectProduct(p)}
                        className="w-full text-left p-4 hover:bg-rose-50 flex items-center justify-between border-b border-rose-50 last:border-0 group"
                      >
                        <div>
                          <p className="text-xs font-black text-slate-950 uppercase group-hover:text-rose-500 transition-colors">{p.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">Cód: {p.code} • Estoque: {p.stockQuantity} un</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase mb-2 tracking-widest">Quantidade a Enviar</label>
            <input required type="number" min="1" className="w-full p-4 bg-[#fffafa] border-2 border-rose-100 rounded-2xl text-slate-950 font-black text-sm outline-none focus:border-rose-400 focus:bg-white" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
          </div>

          <button type="submit" disabled={!selectedProduct || !salonId} className="w-full bg-slate-950 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-black mt-4 shadow-2xl shadow-rose-200 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100">
            {editingConsignment ? 'Salvar Alterações' : 'Confirmar Envio para Salão'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
