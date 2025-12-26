
import React, { useState, useEffect } from 'react';
import { Salon, Sale } from '../types';
import { Store, Phone, MapPin, Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { Modal } from '../components/Modal';

interface SalonsProps {
  salons: Salon[];
  sales: Sale[];
  onAdd: (s: Salon) => void;
  onEdit: (s: Salon) => void;
  onDelete: (id: string) => void;
  onPayCommission: (salonId: string, salesIdsToPay: string[]) => void;
  startOpen?: boolean;
}

export const Salons: React.FC<SalonsProps> = ({ salons, sales, onAdd, onEdit, onDelete, onPayCommission, startOpen }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSalon, setEditingSalon] = useState<Salon | null>(null);
  const [formData, setFormData] = useState<Partial<Salon>>({});

  useEffect(() => {
    if (startOpen) handleOpenAdd();
  }, [startOpen]);

  const handleOpenAdd = () => {
    setEditingSalon(null);
    setFormData({ name: '', contactPerson: '', phone: '', address: '', commissionRate: 0 });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (salon: Salon) => {
    setEditingSalon(salon);
    setFormData(salon);
    setIsAddModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const salonData: Salon = {
        id: editingSalon ? editingSalon.id : Date.now().toString(),
        name: formData.name || '',
        contactPerson: formData.contactPerson || '',
        phone: formData.phone || '',
        address: formData.address || '',
        commissionRate: Number(formData.commissionRate) || 0
    };
    if (editingSalon) onEdit(salonData);
    else onAdd(salonData);
    setIsAddModalOpen(false);
  };

  const getPendingSales = (salonId: string) => sales.filter(s => s.type === 'consignment' && String(s.originSalonId) === String(salonId) && !s.commissionPaid);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-950 flex items-center gap-3 uppercase">
          <Store className="text-rose-500" size={32} /> Salões
        </h2>
        <button onClick={handleOpenAdd} className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:bg-black transition-all">
            <Plus size={20} /> Novo Salão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {salons.map(salon => {
            const pendingSales = getPendingSales(salon.id);
            const commissionValue = (pendingSales.reduce((acc, s) => acc + s.totalValue, 0) * salon.commissionRate) / 100;

            return (
                <div key={salon.id} className="bg-white p-8 rounded-[2.5rem] border border-rose-100 shadow-sm hover:shadow-md transition-all flex flex-col group relative overflow-hidden">
                    <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => handleOpenEdit(salon)} className="p-3 text-blue-600 bg-blue-50 rounded-2xl hover:bg-blue-100"><Edit2 size={20}/></button>
                        <button onClick={() => { if(confirm(`Excluir permanentemente o salão "${salon.name}"?`)) onDelete(salon.id); }} className="p-3 text-rose-600 bg-rose-50 rounded-2xl hover:bg-rose-100"><Trash2 size={20}/></button>
                    </div>
                    
                    <div className="mb-8">
                        <h3 className="font-black text-slate-950 uppercase text-xl mb-3 leading-tight">{salon.name}</h3>
                        <div className="space-y-2">
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{salon.contactPerson}</p>
                            <div className="flex items-center gap-3 text-xs text-slate-950 font-bold bg-[#fffafa] p-3 rounded-xl border border-rose-50"><Phone size={14} className="text-rose-400"/> {salon.phone}</div>
                            <div className="flex items-start gap-3 text-xs text-slate-950 font-bold bg-[#fffafa] p-3 rounded-xl border border-rose-50"><MapPin size={14} className="text-rose-400 mt-0.5"/> {salon.address}</div>
                        </div>
                    </div>
                    
                    <div className="bg-[#fffafa] p-6 rounded-[2rem] border border-rose-50 mt-auto">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-widest">Saldo Pendente</p>
                                <p className="text-3xl font-black text-slate-950 tracking-tighter">R$ {commissionValue.toFixed(0)}</p>
                            </div>
                            <span className="text-[10px] font-black text-rose-600 bg-rose-100 px-3 py-1.5 rounded-full">{salon.commissionRate}% Taxa</span>
                        </div>
                        <button disabled={commissionValue <= 0} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${commissionValue > 0 ? 'bg-slate-950 text-white hover:bg-black' : 'bg-slate-100 text-slate-300'}`}>
                            <FileText size={16} /> Ver Extrato
                        </button>
                    </div>
                </div>
            );
        })}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={editingSalon ? "Editar Salão Parceiro" : "Novo Cadastro"}>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="text-[11px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Nome do Salão</label>
                <input required className="w-full p-5 bg-[#fffafa] border-2 border-rose-50 rounded-2xl text-slate-950 font-black uppercase text-xs focus:bg-white focus:border-rose-400 outline-none transition-all shadow-inner" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
                <label className="text-[11px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Responsável</label>
                <input required className="w-full p-5 bg-[#fffafa] border-2 border-rose-50 rounded-2xl text-slate-950 font-black uppercase text-xs focus:bg-white focus:border-rose-400 outline-none transition-all shadow-inner" value={formData.contactPerson || ''} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Telefone / WhatsApp</label>
                    <input required className="w-full p-5 bg-[#fffafa] border-2 border-rose-50 rounded-2xl text-slate-950 font-black text-xs focus:bg-white focus:border-rose-400 outline-none transition-all shadow-inner" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                    <label className="text-[11px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Taxa Comissão (%)</label>
                    <input type="number" className="w-full p-5 bg-[#fffafa] border-2 border-rose-50 rounded-2xl text-slate-950 font-black text-xs focus:bg-white focus:border-rose-400 outline-none transition-all shadow-inner" value={formData.commissionRate || ''} onChange={e => setFormData({...formData, commissionRate: Number(e.target.value)})} />
                </div>
            </div>
            <div>
                <label className="text-[11px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Endereço</label>
                <input className="w-full p-5 bg-[#fffafa] border-2 border-rose-50 rounded-2xl text-slate-950 font-black uppercase text-xs focus:bg-white focus:border-rose-400 outline-none transition-all shadow-inner" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-slate-950 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-[12px] mt-8 hover:bg-black transition-all">
                Salvar Cadastro
            </button>
        </form>
      </Modal>
    </div>
  );
};
