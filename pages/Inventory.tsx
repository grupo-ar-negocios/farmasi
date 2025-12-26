
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Plus, Search, Package, Trash2, Edit2 } from 'lucide-react';
import { Modal } from '../components/Modal';

interface InventoryProps {
  products: Product[];
  onAdd: (p: Product) => void;
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
    const productData: Product = {
      id: editingProduct ? editingProduct.id : Date.now().toString(),
      code: formData.code || '',
      name: formData.name || '',
      costPrice: Number(formData.costPrice),
      sellPrice: Number(formData.sellPrice),
      stockQuantity: Number(formData.stockQuantity),
      consignedQuantity: formData.consignedQuantity || 0
    };
    if (editingProduct) onEdit(productData);
    else onAdd(productData);
    closeModal();
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
        <h2 className="text-3xl font-black text-slate-950 flex items-center gap-3 uppercase">
          <Package className="text-rose-500" size={32} /> Estoque
        </h2>
        <button onClick={() => openModal()} className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:bg-black transition-all">
          <Plus size={20} /> Novo Produto
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="PESQUISAR CÓDIGO OU NOME..." 
          className="w-full pl-12 pr-10 py-5 bg-[#fffafa] border-2 border-rose-50 rounded-2xl text-slate-950 font-black text-[11px] uppercase focus:outline-none focus:border-rose-400 transition-all shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[2.5rem] border border-rose-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-[#fffafa] border-b border-rose-100 text-[11px] font-black uppercase text-slate-500">
                    <tr>
                        <th className="p-6">Identificador</th>
                        <th className="p-6">Nome do Produto</th>
                        <th className="p-6 text-center">Depósito</th>
                        <th className="p-6 text-center">Consignado</th>
                        <th className="p-6 text-right">Preço Venda</th>
                        <th className="p-6 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-rose-50">
                    {filteredProducts.map(product => (
                        <tr key={product.id} className="hover:bg-rose-50/20 transition-colors">
                            <td className="p-6 font-black text-slate-950 text-xs">{product.code}</td>
                            <td className="p-6 font-black text-slate-950 text-xs uppercase">{product.name}</td>
                            <td className="p-6 text-center">
                                <span className={`font-black text-xs px-4 py-1.5 rounded-full ${product.stockQuantity <= 3 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-950'}`}>
                                    {product.stockQuantity} un
                                </span>
                            </td>
                            <td className="p-6 text-center font-black text-slate-950 text-xs">
                                <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full">{product.consignedQuantity} un</span>
                            </td>
                            <td className="p-6 text-right font-black text-slate-950 text-sm">R$ {product.sellPrice.toFixed(2)}</td>
                            <td className="p-6 text-center">
                                <div className="flex justify-center gap-4">
                                    <button onClick={() => openModal(product)} className="text-blue-600 hover:scale-125 transition-transform"><Edit2 size={20}/></button>
                                    <button onClick={() => { if(confirm(`Excluir permanentemente "${product.name}"?`)) onDelete(product.id); }} className="text-rose-600 hover:scale-125 transition-transform"><Trash2 size={20}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProduct ? "Editar Registro" : "Cadastrar no Sistema"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase mb-2 tracking-widest">Código Identificador</label>
            <input type="text" required className="w-full p-5 bg-[#fffafa] border-2 border-rose-50 rounded-2xl text-slate-950 font-black uppercase text-xs focus:bg-white focus:border-rose-400 outline-none transition-all shadow-inner" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
          </div>
          <div>
            <label className="block text-[11px] font-black text-slate-500 uppercase mb-2 tracking-widest">Nome do Item</label>
            <input type="text" required className="w-full p-5 bg-[#fffafa] border-2 border-rose-50 rounded-2xl text-slate-950 font-black uppercase text-xs focus:bg-white focus:border-rose-400 outline-none transition-all shadow-inner" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase mb-2 tracking-widest">Custo (R$)</label>
              <input type="number" step="0.01" required className="w-full p-5 bg-[#fffafa] border-2 border-rose-50 rounded-2xl text-slate-950 font-black text-xs focus:bg-white focus:border-rose-400 outline-none transition-all shadow-inner" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase mb-2 tracking-widest">Venda (R$)</label>
              <input type="number" step="0.01" required className="w-full p-5 bg-[#fffafa] border-2 border-rose-50 rounded-2xl text-slate-950 font-black text-xs focus:bg-white focus:border-rose-400 outline-none transition-all shadow-inner" value={formData.sellPrice} onChange={e => setFormData({...formData, sellPrice: Number(e.target.value)})} />
            </div>
          </div>
          <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase mb-2 tracking-widest">Quantidade em Depósito</label>
              <input type="number" required className="w-full p-5 bg-[#fffafa] border-2 border-rose-50 rounded-2xl text-slate-950 font-black text-xs focus:bg-white focus:border-rose-400 outline-none transition-all shadow-inner" value={formData.stockQuantity} onChange={e => setFormData({...formData, stockQuantity: Number(e.target.value)})} />
          </div>
          <button type="submit" className="w-full bg-slate-950 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-[12px] mt-8 hover:bg-black shadow-xl">
             Salvar Produto
          </button>
        </form>
      </Modal>
    </div>
  );
};
