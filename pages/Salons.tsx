
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
  const [isExtratoModalOpen, setIsExtratoModalOpen] = useState(false);
  const [selectedSalonId, setSelectedSalonId] = useState<string | null>(null);

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

  const handleOpenExtrato = (salonId: string) => {
    setSelectedSalonId(salonId);
    setIsExtratoModalOpen(true);
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

  const selectedSalon = salons.find(s => s.id === selectedSalonId);
  const pendingSalesForModal = selectedSalonId ? getPendingSales(selectedSalonId) : [];

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center gap-3 uppercase tracking-tighter">
          <Store className="text-[#800020] w-7 h-7 sm:w-8 sm:h-8" /> Parceiros
        </h2>
        <button onClick={handleOpenAdd} className="bg-[#800020] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#600018] shadow-lg shadow-red-900/10 transition-all active:scale-95 w-full sm:w-auto">
          <Plus size={18} /> Novo Cadastro
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {salons.map(salon => {
          const pendingSales = getPendingSales(salon.id);
          const commissionValue = (pendingSales.reduce((acc, s) => acc + s.totalValue, 0) * salon.commissionRate) / 100;

          return (
            <div key={salon.id} className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col group relative overflow-hidden">
              <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex gap-2 sm:gap-3 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => handleOpenEdit(salon)} className="p-2 sm:p-3 text-blue-600 bg-blue-50/50 rounded-xl sm:rounded-2xl hover:bg-blue-50 transition-colors"><Edit2 size={18} /></button>
                <button onClick={() => { if (confirm(`Excluir permanentemente o salão "${salon.name}"?`)) onDelete(salon.id); }} className="p-2 sm:p-3 text-[#800020] bg-red-50/50 rounded-xl sm:rounded-2xl hover:bg-red-50 transition-colors"><Trash2 size={18} /></button>
              </div>

              <div className="mb-6 sm:mb-8">
                <h3 className="font-bold text-slate-900 uppercase text-base sm:text-lg mb-3 sm:mb-4 leading-tight tracking-tight line-clamp-1 pr-16 sm:pr-24">{salon.name}</h3>
                <div className="space-y-2 sm:space-y-3">
                  <p className="text-[9px] sm:text-[10px] font-bold text-[#D4AF37] uppercase tracking-[0.2em] sm:tracking-[0.3em]">{salon.contactPerson}</p>
                  <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-slate-600 font-bold bg-slate-50 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-100"><Phone size={14} className="text-[#800020] shrink-0" /> {salon.phone}</div>
                  <div className="flex items-start gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-slate-600 font-bold bg-slate-50 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-slate-100"><MapPin size={14} className="text-[#800020] mt-0.5 shrink-0" /> <span className="line-clamp-2">{salon.address}</span></div>
                </div>
              </div>

              <div className="bg-slate-50 p-5 sm:p-6 rounded-xl sm:rounded-[2rem] border border-slate-100 mt-auto relative overflow-hidden">
                <div className="flex justify-between items-end mb-3 sm:mb-4 relative z-10">
                  <div>
                    <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase mb-1 sm:mb-2 tracking-widest">Pendência</p>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter leading-none">R$ {commissionValue.toFixed(0)}</p>
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-bold text-[#800020] bg-white border border-red-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full tracking-tighter shrink-0">{salon.commissionRate}%</span>
                </div>
                <button onClick={() => handleOpenExtrato(salon.id)} disabled={commissionValue <= 0} className={`w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all relative z-10 ${commissionValue > 0 ? 'bg-[#800020] text-white hover:bg-[#600018] shadow-md shadow-red-900/5' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                  <FileText size={16} /> Extrato
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={editingSalon ? "Dados do Parceiro" : "Novo Parceiro"}>
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div>
            <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-2 sm:mb-3 block tracking-widest">Nome do Estabelecimento</label>
            <input required className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-slate-900 font-bold uppercase text-[10px] sm:text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all shadow-sm" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-2 sm:mb-3 block tracking-widest">Responsável</label>
            <input required className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-slate-900 font-bold uppercase text-[10px] sm:text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all shadow-sm" value={formData.contactPerson || ''} onChange={e => setFormData({ ...formData, contactPerson: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-2 sm:mb-3 block tracking-widest">Whatsapp</label>
              <input required className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-slate-900 font-bold text-[10px] sm:text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all shadow-sm" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-2 sm:mb-3 block tracking-widest">Comissão (%)</label>
              <input type="number" className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-slate-900 font-bold text-[10px] sm:text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all shadow-sm" value={formData.commissionRate || ''} onChange={e => setFormData({ ...formData, commissionRate: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-2 sm:mb-3 block tracking-widest">Localização / Endereço</label>
            <input className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-slate-900 font-bold uppercase text-[10px] sm:text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all shadow-sm" value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <button type="submit" className="w-full bg-[#800020] text-white py-5 sm:py-6 rounded-2xl sm:rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] sm:text-[11px] mt-4 sm:mt-8 hover:bg-[#600018] shadow-xl shadow-red-900/10 transition-all active:scale-95">
            Confirmar Registro
          </button>
        </form>
      </Modal>

      <Modal isOpen={isExtratoModalOpen} onClose={() => setIsExtratoModalOpen(false)} title={`Extrato: ${selectedSalon?.name}`}>
        <div className="space-y-6">
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar space-y-3">
            {pendingSalesForModal.map(sale => (
              <div key={sale.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(sale.date).toLocaleDateString()}</span>
                  <span className="text-xs font-black text-slate-950">R$ {sale.totalValue.toFixed(2)}</span>
                </div>
                <div className="space-y-1">
                  {sale.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-[10px] font-bold text-slate-600 uppercase">
                      <span>{item.quantity}x {item.productName}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Comissão ({selectedSalon?.commissionRate}%):</span>
                  <span className="text-[10px] font-black text-[#800020]">R$ {((sale.totalValue * (selectedSalon?.commissionRate || 0)) / 100).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total à Pagar</p>
              <p className="text-2xl font-black text-slate-950">R$ {((pendingSalesForModal.reduce((acc, s) => acc + s.totalValue, 0) * (selectedSalon?.commissionRate || 0)) / 100).toFixed(2)}</p>
            </div>
            <button
              onClick={() => {
                if (selectedSalonId && confirm("Marcar todas estas vendas como pagas?")) {
                  onPayCommission(selectedSalonId, pendingSalesForModal.map(s => s.id));
                  setIsExtratoModalOpen(false);
                }
              }}
              className="bg-[#800020] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#600018] transition-all"
            >
              Marcar como Pago
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
