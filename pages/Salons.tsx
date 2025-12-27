
import React, { useState, useEffect } from 'react';
import { Salon, Sale } from '../types';
import { Store, Phone, MapPin, Plus, Edit2, Trash2, FileText } from 'lucide-react';
import { Modal } from '../components/Modal';

interface SalonsProps {
  salons: Salon[];
  sales: Sale[];
  onAdd: (s: Omit<Salon, 'id'>) => void;
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
    const salonData: any = {
      name: formData.name || '',
      contactPerson: formData.contactPerson || '',
      phone: formData.phone || '',
      address: formData.address || '',
      commissionRate: Number(formData.commissionRate) || 0
    };

    if (editingSalon) {
      salonData.id = editingSalon.id;
      onEdit(salonData as Salon);
    } else {
      onAdd(salonData as Salon);
    }
    setIsAddModalOpen(false);
  };

  const getPendingSales = (salonId: string) => sales.filter(s => s.type === 'consignment' && String(s.originSalonId) === String(salonId) && !s.commissionPaid);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-950 flex items-center gap-3 uppercase tracking-tighter">
          <Store className="text-[#800020]" size={32} /> Salões Parceiros
        </h2>
        <button onClick={handleOpenAdd} className="bg-[#800020] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-[#600018] shadow-lg shadow-red-900/10 transition-all">
          <Plus size={18} /> Novo Cadastro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {salons.map(salon => {
          const pendingSales = getPendingSales(salon.id);
          const commissionValue = (pendingSales.reduce((acc, s) => acc + s.totalValue, 0) * salon.commissionRate) / 100;

          return (
            <div key={salon.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col group relative overflow-hidden">
              <div className="absolute top-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => handleOpenEdit(salon)} className="p-3 text-blue-600 bg-blue-50/50 rounded-2xl hover:bg-blue-50 transition-colors"><Edit2 size={18} /></button>
                <button onClick={() => { if (confirm(`Excluir permanentemente o salão "${salon.name}"?`)) onDelete(salon.id); }} className="p-3 text-[#800020] bg-red-50/50 rounded-2xl hover:bg-red-50 transition-colors"><Trash2 size={18} /></button>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-slate-900 uppercase text-lg mb-4 leading-tight tracking-tight">{salon.name}</h3>
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.3em]">{salon.contactPerson}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-600 font-bold bg-slate-50 p-3 rounded-xl border border-slate-100"><Phone size={14} className="text-[#800020]" /> {salon.phone}</div>
                  <div className="flex items-start gap-3 text-[11px] text-slate-600 font-bold bg-slate-50 p-3 rounded-xl border border-slate-100"><MapPin size={14} className="text-[#800020] mt-0.5" /> {salon.address}</div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mt-auto relative overflow-hidden">
                <div className="flex justify-between items-end mb-4 relative z-10">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Pendência Financeira</p>
                    <p className="text-3xl font-black text-slate-900 tracking-tighter">R$ {commissionValue.toFixed(0)}</p>
                  </div>
                  <span className="text-[9px] font-bold text-[#800020] bg-white border border-red-100 px-3 py-1.5 rounded-full tracking-tighter">{salon.commissionRate}% Taxa</span>
                </div>
                <button disabled={commissionValue <= 0} className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all relative z-10 ${commissionValue > 0 ? 'bg-[#800020] text-white hover:bg-[#600018] shadow-md shadow-red-900/5' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                  <FileText size={16} /> Detalhes do Extrato
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={editingSalon ? "Dados do Estabelecimento" : "Novo Cadastro FARMASI"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block tracking-widest">Nome do Salão</label>
            <input required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold uppercase text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block tracking-widest">Responsável Legal</label>
            <input required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold uppercase text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all" value={formData.contactPerson || ''} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block tracking-widest">Contato WhatsApp</label>
              <input required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block tracking-widest">Percentual Loja (%)</label>
              <input type="number" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all" value={formData.commissionRate || ''} onChange={e => setFormData({ ...formData, commissionRate: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block tracking-widest">Endereço Completo</label>
            <input className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold uppercase text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <button type="submit" className="w-full bg-[#800020] text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] mt-8 hover:bg-[#600018] shadow-lg shadow-red-900/10 transition-all hover:-translate-y-0.5">
            Salvar e Confirmar
          </button>
        </form>
      </Modal>
    </div>
  );
};
