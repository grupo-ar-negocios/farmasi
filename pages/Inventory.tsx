import React, { useState, useEffect } from 'react';
import { Product, Client } from '../types';
import { Plus, Search, Package, Trash2, Edit2 } from 'lucide-react';
import { Modal } from '../components/Modal';
import { normalizeString } from '../services/utils';

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

  // Replenishment states
  const [isReplenishOpen, setIsReplenishOpen] = useState(false);
  const [replenishProduct, setReplenishProduct] = useState<Product | null>(null);
  const [replenishQty, setReplenishQty] = useState(0);
  const [replenishCost, setReplenishCost] = useState(0);

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

  const openReplenishModal = (product: Product) => {
    setReplenishProduct(product);
    setReplenishQty(1);
    setReplenishCost(product.costPrice);
    setIsReplenishOpen(true);
  };

  const handleReplenishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replenishProduct) return;

    const currentQty = replenishProduct.stockQuantity;
    const consignedQty = replenishProduct.consignedQuantity;
    const currentCost = replenishProduct.costPrice;
    const addedQty = Number(replenishQty) || 0;
    const addedCost = Number(replenishCost) || 0;

    if (addedQty <= 0) {
      alert("A quantidade deve ser maior que zero!");
      return;
    }

    const currentTotalOwned = currentQty + consignedQty;
    const newQty = currentQty + addedQty;
    const newTotalOwned = currentTotalOwned + addedQty;

    let newCost = currentCost;
    if (currentTotalOwned <= 0) {
      newCost = addedCost;
    } else {
      newCost = ((currentTotalOwned * currentCost) + (addedQty * addedCost)) / newTotalOwned;
    }

    const updatedProduct: Product = {
      ...replenishProduct,
      stockQuantity: newQty,
      costPrice: Number(newCost.toFixed(4)) // Keep decimal precision for average calculations
    };

    onEdit(updatedProduct);
    setIsReplenishOpen(false);
    setReplenishProduct(null);
  };

  const filteredProducts = products.filter(p =>
    normalizeString(p.name).includes(normalizeString(searchTerm)) ||
    normalizeString(p.code).includes(normalizeString(searchTerm))
  );

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center gap-3 uppercase tracking-tighter">
          <Package className="text-[#800020] w-7 h-7 sm:w-8 sm:h-8" /> Estoque
        </h2>
        <button onClick={() => openModal()} className="bg-[#800020] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#600018] shadow-lg shadow-red-900/10 transition-all w-full sm:w-auto">
          <Plus size={18} /> Novo Produto
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
        <input
          type="text"
          placeholder="PESQUISAR CÓDIGO OU NOME..."
          className="w-full pl-12 sm:pl-14 pr-10 py-4 sm:py-5 bg-white border border-slate-100 rounded-xl sm:rounded-2xl text-slate-950 font-bold text-[9px] sm:text-[10px] uppercase tracking-wider focus:outline-none focus:border-[#800020]/30 shadow-sm transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[700px] sm:min-w-0">
            <thead className="bg-[#fcf8f9] border-b border-slate-50 text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-5 sm:px-8 py-4 sm:py-6 whitespace-nowrap">ID / Cód</th>
                <th className="px-5 sm:px-8 py-4 sm:py-6">Designação</th>
                <th className="px-5 sm:px-8 py-4 sm:py-6 text-center">Central</th>
                <th className="px-5 sm:px-8 py-4 sm:py-6 text-center">Consig</th>
                <th className="px-5 sm:px-8 py-4 sm:py-6 text-right">Compra</th>
                <th className="px-5 sm:px-8 py-4 sm:py-6 text-right">Venda</th>
                <th className="px-5 sm:px-8 py-4 sm:py-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map(product => (
                <tr key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-5 sm:px-8 py-4 sm:py-6 font-bold text-slate-900 text-[11px] sm:text-xs tracking-tight whitespace-nowrap">{product.code}</td>
                  <td className="px-5 sm:px-8 py-4 sm:py-6 font-bold text-slate-900 text-[11px] sm:text-xs uppercase tracking-tight">{product.name}</td>
                  <td className="px-5 sm:px-8 py-4 sm:py-6 text-center whitespace-nowrap">
                    <span className={`font-bold text-[9px] sm:text-[10px] px-3 sm:px-4 py-1.5 rounded-full uppercase ${product.stockQuantity <= 3 ? 'bg-red-50 text-[#800020]' : 'bg-slate-50 text-slate-600'}`}>
                      {product.stockQuantity} un
                    </span>
                  </td>
                  <td className="px-5 sm:px-8 py-4 sm:py-6 text-center font-bold text-slate-900 text-xs whitespace-nowrap">
                    <span className="bg-blue-50/50 text-blue-600 px-3 sm:px-4 py-1.5 rounded-full uppercase text-[9px] sm:text-[10px]">{product.consignedQuantity} un</span>
                  </td>
                  <td className="px-5 sm:px-8 py-4 sm:py-6 text-right font-bold text-slate-500 text-xs sm:text-sm whitespace-nowrap">R$ {product.costPrice.toFixed(2)}</td>
                  <td className="px-5 sm:px-8 py-4 sm:py-6 text-right font-bold text-slate-950 text-xs sm:text-sm whitespace-nowrap">R$ {product.sellPrice.toFixed(2)}</td>
                  <td className="px-5 sm:px-8 py-4 sm:py-6 text-center">
                    <div className="flex justify-center gap-1 sm:gap-3 opacity-100 sm:opacity-20 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openReplenishModal(product)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Repor Estoque"><Package size={16} /></button>
                      <button onClick={() => openModal(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar"><Edit2 size={16} /></button>
                      <button onClick={() => { if (confirm(`Excluir permanentemente "${product.name}"?`)) onDelete(product.id); }} className="p-2 text-[#800020] hover:bg-red-50 rounded-lg transition-colors" title="Excluir"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProduct ? "Propriedades do Produto" : "Novo Cadastro FLUXO BEAUTY"}>
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

      <Modal isOpen={isReplenishOpen} onClose={() => setIsReplenishOpen(false)} title={`Repor Estoque: ${replenishProduct?.name}`}>
        <form onSubmit={handleReplenishSubmit} className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200/60 pb-1">Estado Atual</p>
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Estoque Central:</span>
              <span>{replenishProduct?.stockQuantity} un</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Estoque Consignado:</span>
              <span>{replenishProduct?.consignedQuantity} un</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>Total Possuído:</span>
              <span>{(replenishProduct?.stockQuantity || 0) + (replenishProduct?.consignedQuantity || 0)} un</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-700 pt-1 border-t border-slate-200/60">
              <span>Custo Unitário Atual:</span>
              <span>R$ {replenishProduct?.costPrice.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Quantidade Adicionada</label>
            <input 
              type="number" 
              required 
              min="1"
              className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all" 
              value={replenishQty} 
              onChange={e => setReplenishQty(Number(e.target.value))} 
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-widest">Novo Custo Unitário de Compra (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              required 
              min="0"
              className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all" 
              value={replenishCost} 
              onChange={e => setReplenishCost(Number(e.target.value))} 
            />
          </div>

          {/* Real-time Preview calculations */}
          {replenishProduct && (Number(replenishQty) > 0) && (
            <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl space-y-2 animate-in zoom-in duration-300">
              <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest border-b border-emerald-200 pb-1">Valores Projetados</p>
              <div className="flex justify-between text-xs font-bold text-emerald-900">
                <span>Novo Estoque Central:</span>
                <span>{replenishProduct.stockQuantity + (Number(replenishQty) || 0)} un</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-emerald-900">
                <span>Estoque Consignado:</span>
                <span>{replenishProduct.consignedQuantity} un</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-emerald-900">
                <span>Novo Total Possuído:</span>
                <span>{replenishProduct.stockQuantity + replenishProduct.consignedQuantity + (Number(replenishQty) || 0)} un</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-emerald-900 pt-1 border-t border-emerald-200">
                <span>Novo Custo Médio:</span>
                <span>
                  R$ {(() => {
                    const currentQty = replenishProduct.stockQuantity;
                    const consignedQty = replenishProduct.consignedQuantity;
                    const currentCost = replenishProduct.costPrice;
                    const addedQty = Number(replenishQty) || 0;
                    const addedCost = Number(replenishCost) || 0;
                    const currentTotalOwned = currentQty + consignedQty;
                    const newTotalOwned = currentTotalOwned + addedQty;
                    if (newTotalOwned <= 0) return 0;
                    if (currentTotalOwned <= 0) return addedCost;
                    return (((currentTotalOwned * currentCost) + (addedQty * addedCost)) / newTotalOwned);
                  })().toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <button type="submit" className="w-full bg-[#800020] text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] mt-8 hover:bg-[#600018] shadow-lg shadow-red-900/10 transition-all hover:-translate-y-0.5">
            Confirmar Reposição
          </button>
        </form>
      </Modal>
    </div>
  );
};
