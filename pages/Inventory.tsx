import React, { useState, useEffect } from 'react';
import { Product, Client } from '../types';
import { Plus, Search, Package, Trash2, Edit2 } from 'lucide-react';
import { Modal } from '../components/Modal';

interface InventoryProps {
  products: Product[];
  onAdd: (p: Omit<Product, 'id'>) => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
  startOpen?: boolean;
}

export const Inventory: React.FC<InventoryProps> = ({ products, onAdd, onEdit, onDelete, startOpen }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (startOpen) openModal();
  }, [startOpen]);

  const [formData, setFormData] = useState<Partial<Product>>({
    code: '', name: '', costPrice: 0, sellPrice: 0, stockQuantity: 0, consignedQuantity: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const productData: any = {
      code: formData.code || '',
      name: formData.name || '',
      costPrice: Number(formData.costPrice) || 0,
      sellPrice: Number(formData.sellPrice) || 0,
      stockQuantity: Number(formData.stockQuantity) || 0,
      consignedQuantity: editingProduct ? editingProduct.consignedQuantity : 0,
    };

    if (editingProduct) {
      productData.id = editingProduct.id;
      onEdit(productData as Product);
    } else {
      onAdd(productData as Product);
    }
    setIsModalOpen(false);
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({ code: '', name: '', costPrice: 0, sellPrice: 0, stockQuantity: 0, consignedQuantity: 0 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-950 flex items-center gap-3 uppercase tracking-tighter">
          <Package className="text-[#800020]" size={32} /> Estoque
        </h2>
        <button onClick={() => openModal()} className="bg-[#800020] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-[#600018] shadow-lg shadow-red-900/10 transition-all">
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="PESQUISAR CÓDIGO OU NOME..."
          className="w-full pl-14 pr-10 py-5 bg-white border border-slate-100 rounded-2xl text-slate-950 font-bold text-[10px] uppercase tracking-wider focus:outline-none focus:border-[#800020]/30 shadow-sm transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#fcf8f9] border-b border-slate-50 text-[10px] font-bold uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-8 py-6">ID / Cód</th>
                <th className="px-8 py-6">Designação do Produto</th>
                <th className="px-8 py-6 text-center">Estoque Central</th>
                <th className="px-8 py-6 text-center">Consignado</th>
                <th className="px-8 py-6 text-right">Preço Venda</th>
                <th className="px-8 py-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6 font-bold text-slate-900 text-xs tracking-tight">{product.code}</td>
                  <td className="px-8 py-6 font-bold text-slate-900 text-xs uppercase tracking-tight">{product.name}</td>
                  <td className="px-8 py-6 text-center">
                    <span className={`font-bold text-[10px] px-4 py-1.5 rounded-full uppercase ${product.stockQuantity <= 3 ? 'bg-red-50 text-[#800020]' : 'bg-slate-50 text-slate-600'}`}>
                      {product.stockQuantity} un
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center font-bold text-slate-900 text-xs">
                    <span className="bg-blue-50/50 text-blue-600 px-4 py-1.5 rounded-full uppercase text-[10px]">{product.consignedQuantity} un</span>
                  </td>
                  <td className="px-8 py-6 text-right font-bold text-slate-950 text-sm">R$ {product.sellPrice.toFixed(2)}</td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex justify-center gap-3 opacity-20 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => { if (confirm(`Excluir permanentemente "${product.name}"?`)) onDelete(product.id); }} className="p-2 text-[#800020] hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProduct ? "Propriedades do Produto" : "Novo Cadastro FARMASI"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Código Identificador</label>
            <input type="text" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold uppercase text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Nome do Item</label>
            <input type="text" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold uppercase text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Custo Unitário (R$)</label>
              <input type="number" step="0.01" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all" value={formData.costPrice} onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Venda Sugerida (R$)</label>
              <input type="number" step="0.01" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all" value={formData.sellPrice} onChange={e => setFormData({ ...formData, sellPrice: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Unidades em Depósito</label>
            <input type="number" required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all" value={formData.stockQuantity} onChange={e => setFormData({ ...formData, stockQuantity: Number(e.target.value) })} />
          </div>
          <button type="submit" className="w-full bg-[#800020] text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] mt-8 hover:bg-[#600018] shadow-lg shadow-red-900/10 transition-all hover:-translate-y-0.5">
            Confirmar Alterações
          </button>
        </form>
      </Modal>
    </div>
  );
};
