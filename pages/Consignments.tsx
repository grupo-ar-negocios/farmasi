
import React, { useState, useEffect, useMemo } from 'react';
import { Consignment, Salon, Product } from '../types';
import { Handshake, Plus, ArrowRight, Edit2, Trash2, Search, X, CheckCircle2 } from 'lucide-react';
import { Modal } from '../components/Modal';

interface ConsignmentsProps {
  consignments: Consignment[];
  salons: Salon[];
  products: Product[];
  onAdd: (c: Omit<Consignment, 'id'>) => void;
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

  const filteredConsignments = useMemo(() => {
    const term = searchTerm.toLowerCase();
    if (!term) return consignments;
    return consignments.filter(c => {
      const salon = salons.find(s => String(s.id) === String(c.salonId));
      return salon?.name.toLowerCase().includes(term);
    });
  }, [consignments, salons, searchTerm]);

  const handleSelectProduct = (p: Product) => {
    setSelectedProduct(p);
    setProductSearch('');
    setShowResults(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const baseConsignmentData = {
      salonId,
      productId: selectedProduct.id,
      quantity,
      soldQuantity: editingConsignment ? editingConsignment.soldQuantity : 0,
      returnedQuantity: editingConsignment ? editingConsignment.returnedQuantity : 0,
      status: editingConsignment ? editingConsignment.status : 'active',
      date: editingConsignment ? editingConsignment.date : new Date().toISOString()
    };

    if (editingConsignment) {
      const updatedConsignment: Consignment = {
        ...baseConsignmentData,
        id: editingConsignment.id,
      };
      onEdit(updatedConsignment);
    } else {
      onAdd(baseConsignmentData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-950 flex items-center gap-3 uppercase tracking-tighter">
          <Handshake className="text-[#800020]" size={32} /> Consignações
        </h2>
        <div className="flex gap-4">
          <label className="flex items-center gap-4 bg-white border border-slate-100 px-6 py-4 rounded-2xl shadow-sm text-slate-400 font-bold text-[10px] uppercase tracking-widest">
            <Search size={18} />
            <input
              type="text"
              placeholder="Filter by salon..."
              className="outline-none placeholder:text-slate-300 text-slate-900 w-48 bg-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
          <button onClick={() => openModal()} className="bg-[#800020] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-lg shadow-red-900/10 hover:bg-[#600018] transition-all">
            <Plus size={18} /> Novo Envio
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#fcf8f9] text-slate-400 font-bold uppercase text-[10px] border-b border-slate-50 tracking-widest">
              <tr>
                <th className="px-8 py-6">Data de Envio</th>
                <th className="px-8 py-6">Salão Parceiro</th>
                <th className="px-8 py-6">Produto Enviado</th>
                <th className="px-8 py-6 text-center">Quantidades</th>
                <th className="px-8 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredConsignments.map(c => {
                const salon = salons.find(s => String(s.id) === String(c.salonId));
                const product = products.find(p => String(p.id) === String(c.productId));
                const remaining = c.quantity - c.soldQuantity - c.returnedQuantity;

                return (
                  <tr key={c.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5 text-slate-950 font-bold text-xs uppercase">{new Date(c.date).toLocaleDateString()}</td>
                    <td className="px-8 py-5 text-slate-950 font-bold text-xs uppercase">{salon?.name}</td>
                    <td className="px-8 py-5 text-slate-950 font-bold text-xs uppercase">{product?.name}</td>
                    <td className="px-8 py-5 text-center">
                      <div className="inline-flex items-center gap-2 bg-[#fffafa] border border-slate-100 rounded-full px-4 py-2 text-[10px] font-black uppercase">
                        <span className="text-slate-400">Total:</span>
                        <span className="text-slate-950">{c.quantity}</span>
                        <span className="text-slate-400">| Vendido:</span>
                        <span className="text-emerald-600">{c.soldQuantity}</span>
                        <span className="text-slate-400">| Saldo:</span>
                        <span className="text-[#800020]">{remaining}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <span className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase px-4 py-2 rounded-full">
                        <CheckCircle2 size={12} /> Em Aberto
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(c)} className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Edit2 size={14} /></button>
                        <button onClick={() => { if (confirm("Excluir consignado?")) onDelete(c.id); }} className="p-2 bg-red-50 text-red-600 rounded-lg"><Trash2 size={14} /></button>
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase mb-2 tracking-widest">Salão Parceiro</label>
            <select required className="w-full p-4 bg-[#fffafa] border-2 border-slate-100 rounded-2xl text-slate-950 font-black text-xs uppercase outline-none focus:border-[#800020]" value={salonId} onChange={e => setSalonId(e.target.value)}>
              <option value="">Selecione o Salão...</option>
              {salons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="space-y-4">
            <label className="block text-[11px] font-black text-slate-500 uppercase mb-2 tracking-widest">Produto para Envio</label>

            {selectedProduct ? (
              <div className="flex items-center justify-between bg-white p-5 rounded-2xl border-2 border-[#800020] animate-in zoom-in duration-300 shadow-sm">
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="text-[#800020]" size={24} />
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selecionado</p>
                    <p className="text-sm font-black text-slate-950 uppercase">{selectedProduct.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Em Estoque: {selectedProduct.stockQuantity} un</p>
                  </div>
                </div>
                <button type="button" onClick={() => setSelectedProduct(null)} className="text-slate-400 hover:text-[#800020] p-2"><X size={20} /></button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#800020]" size={18} />
                  <input
                    type="text"
                    placeholder="PESQUISAR PRODUTO NO ESTOQUE..."
                    className="w-full pl-12 pr-4 py-4 bg-[#fffafa] border-2 border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-wider outline-none focus:border-[#800020] focus:bg-white"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowResults(true);
                    }}
                  />
                </div>

                {showResults && filteredProducts.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 top-full mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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
