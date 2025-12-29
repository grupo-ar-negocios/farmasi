import React, { useState, useEffect } from 'react';
import { Client, Sale } from '../types';
import { Users, Phone, Instagram, Plus, Edit2, Trash2, Search, History, Calendar, Package, DollarSign } from 'lucide-react';
import { Modal } from '../components/Modal';

interface ClientsProps {
  clients: Client[];
  sales: Sale[];
  onAdd: (c: Omit<Client, 'id'>) => void;
  onEdit: (c: Client) => void;
  onDelete: (id: string) => void;
  startOpen?: boolean;
}

export const Clients: React.FC<ClientsProps> = ({ clients, sales, onAdd, onEdit, onDelete, startOpen }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [historyClient, setHistoryClient] = useState<Client | null>(null);

  useEffect(() => {
    if (startOpen) handleOpenAdd();
  }, [startOpen]);

  const handleOpenAdd = () => {
    setEditingClient(null);
    setFormData({ name: '', phone: '', instagram: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormData(client);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clientData: any = {
      name: formData.name || '',
      phone: formData.phone || '',
      instagram: formData.instagram || ''
    };

    if (editingClient) {
      clientData.id = editingClient.id;
      onEdit(clientData as Client);
    } else {
      onAdd(clientData as Client);
    }

    setIsModalOpen(false);
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 flex items-center gap-3 uppercase tracking-tighter">
          <Users className="text-[#800020] w-7 h-7 sm:w-8 sm:h-8" /> Clientes
        </h2>
        <button onClick={handleOpenAdd} className="w-full sm:w-auto bg-[#800020] text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-[#600018] shadow-lg shadow-red-900/10 transition-all active:scale-95">
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
        <input
          type="text"
          placeholder="PESQUISAR CLIENTE..."
          className="w-full pl-12 sm:pl-14 pr-6 py-4 sm:py-5 bg-white border border-slate-100 rounded-xl sm:rounded-2xl text-slate-950 font-bold text-[10px] uppercase tracking-wider focus:outline-none focus:border-[#800020]/30 shadow-sm transition-all placeholder:text-slate-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
            <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => handleOpenEdit(client)} className="p-2.5 sm:p-3 text-blue-600 bg-blue-50/50 rounded-xl hover:bg-blue-50 transition-colors"><Edit2 size={16} /></button>
              <button onClick={() => { if (confirm(`Excluir permanentemente o cliente "${client.name}"?`)) onDelete(client.id); }} className="p-2.5 sm:p-3 text-[#800020] bg-red-50/50 rounded-xl hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
            </div>

            <div className="flex items-center gap-4 sm:gap-5 mb-6 sm:mb-8">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100 flex items-center justify-center text-[#800020] font-black text-xl sm:text-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.03)] uppercase">
                {client.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-slate-900 uppercase text-sm sm:text-base leading-tight tracking-tight truncate pr-14 lg:pr-0">{client.name}</h3>
                <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1">Parceria Ativa</p>
              </div>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-slate-700 font-bold bg-slate-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100/50">
                <Phone size={14} className="text-[#D4AF37] shrink-0" /> {client.phone}
              </div>
              {client.instagram && (
                <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-slate-700 font-bold bg-slate-50/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100/50">
                  <Instagram size={14} className="text-[#800020] shrink-0" /> {client.instagram}
                </div>
              )}
            </div>

            <button
              onClick={() => setHistoryClient(client)}
              className="w-full mt-5 sm:mt-6 py-3.5 sm:py-4 bg-slate-950 text-white rounded-xl sm:rounded-2xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#800020] transition-colors active:scale-95"
            >
              <History size={14} /> Histórico de Compras
            </button>
          </div>
        ))}
        {filteredClients.length === 0 && (
          <div className="col-span-full py-16 sm:py-24 text-center bg-white rounded-2xl sm:rounded-[3rem] border-2 border-dashed border-rose-100">
            <Users size={48} className="sm:size-16 mx-auto text-slate-100 mb-4 sm:mb-6" />
            <p className="text-[10px] sm:text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] sm:tracking-[0.3em]">Nenhum registro encontrado</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient ? "Editar Registro" : "Novo Cadastro"}>
        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          <div>
            <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-2 sm:mb-3 block tracking-[0.2em]">Nome Completo</label>
            <input required className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-slate-900 font-bold uppercase text-[10px] sm:text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all shadow-sm" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-2 sm:mb-3 block tracking-[0.2em]">WhatsApp</label>
            <input required className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-slate-900 font-bold text-[10px] sm:text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all shadow-sm" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mb-2 sm:mb-3 block tracking-[0.2em]">Instagram (Opcional)</label>
            <input placeholder="@user" className="w-full p-4 sm:p-5 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-slate-900 font-bold text-[10px] sm:text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all shadow-sm" value={formData.instagram || ''} onChange={e => setFormData({ ...formData, instagram: e.target.value })} />
          </div>
          <button type="submit" className="w-full bg-[#800020] text-white py-5 sm:py-6 rounded-2xl sm:rounded-3xl font-black uppercase tracking-widest text-[10px] sm:text-[11px] mt-4 sm:mt-8 hover:bg-[#600018] shadow-lg shadow-red-900/10 transition-all active:scale-95">
            {editingClient ? 'Salvar Registro' : 'Concluir Cadastro'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={!!historyClient} onClose={() => setHistoryClient(null)} title={`Histórico: ${historyClient?.name}`}>
        <div className="space-y-4">
          {sales.filter(s => s.clientId === historyClient?.id).length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest">
              Nenhuma compra registrada.
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {sales.filter(s => s.clientId === historyClient?.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(sale => (
                <div key={sale.id} className="bg-slate-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-100">
                  <div className="flex justify-between items-center mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-slate-200/50">
                    <div className="flex items-center gap-2 text-slate-900 font-black text-[9px] sm:text-[10px] uppercase">
                      <Calendar size={14} className="text-[#800020]" />
                      {new Date(sale.date).toLocaleDateString()}
                    </div>
                    <div className="text-[#800020] font-black text-xs sm:text-sm">
                      R$ {sale.totalValue.toFixed(2)}
                    </div>
                  </div>
                  <div className="space-y-3">
                    {sale.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-lg border border-slate-100 flex items-center justify-center text-[#800020] shrink-0">
                            <Package size={12} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-bold text-slate-800 uppercase text-[10px] sm:text-[11px] truncate">{item.productName}</p>
                            <p className="text-[8px] sm:text-[9px] text-slate-400 uppercase">{item.quantity}x R$ {item.unitPrice.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="font-bold text-slate-700 text-[10px] sm:text-[11px] shrink-0">
                          R$ {(item.quantity * item.unitPrice).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
