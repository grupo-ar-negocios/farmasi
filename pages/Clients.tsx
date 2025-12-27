import React, { useState, useEffect } from 'react';
import { Client } from '../types';
import { Users, Phone, Instagram, Plus, Edit2, Trash2, Search } from 'lucide-react';
import { Modal } from '../components/Modal';

interface ClientsProps {
  clients: Client[];
  onAdd: (c: Omit<Client, 'id'>) => void;
  onEdit: (c: Client) => void;
  onDelete: (id: string) => void;
  startOpen?: boolean;
}

export const Clients: React.FC<ClientsProps> = ({ clients, onAdd, onEdit, onDelete, startOpen }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Client>>({});

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-950 flex items-center gap-3 uppercase tracking-tighter">
          <Users className="text-[#800020]" size={32} /> Clientes
        </h2>
        <button onClick={handleOpenAdd} className="bg-[#800020] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-[#600018] shadow-lg shadow-red-900/10 transition-all">
          <Plus size={18} /> Novo Cliente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="PESQUISAR POR NOME OU WHATSAPP..."
          className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-2xl text-slate-950 font-bold text-[10px] uppercase tracking-wider focus:outline-none focus:border-[#800020]/30 shadow-sm transition-all placeholder:text-slate-300"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden">
            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => handleOpenEdit(client)} className="p-3 text-blue-600 bg-blue-50/50 rounded-xl hover:bg-blue-50 transition-colors"><Edit2 size={18} /></button>
              <button onClick={() => { if (confirm(`Excluir permanentemente o cliente "${client.name}"?`)) onDelete(client.id); }} className="p-3 text-[#800020] bg-red-50/50 rounded-xl hover:bg-red-50 transition-colors"><Trash2 size={18} /></button>
            </div>

            <div className="flex items-center gap-5 mb-8">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-[#800020] font-black text-2xl shadow-[inset_0_2px_8px_rgba(0,0,0,0.03)] uppercase">
                {client.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 uppercase text-base leading-tight tracking-tight">{client.name}</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Parceria Ativa</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 text-[11px] text-slate-700 font-bold bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                <Phone size={14} className="text-[#D4AF37]" /> {client.phone}
              </div>
              {client.instagram && (
                <div className="flex items-center gap-4 text-[11px] text-slate-700 font-bold bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                  <Instagram size={14} className="text-[#800020]" /> {client.instagram}
                </div>
              )}
            </div>
          </div>
        ))}
        {filteredClients.length === 0 && (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-rose-100">
            <Users size={64} className="mx-auto text-slate-100 mb-6" />
            <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Nenhum registro encontrado</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient ? "Editar Registro" : "Novo Cadastro"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block tracking-[0.2em]">Nome Completo</label>
            <input required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold uppercase text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block tracking-[0.2em]">WhatsApp Comercial</label>
            <input required className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block tracking-[0.2em]">Instagram Profile (Opcional)</label>
            <input placeholder="@user" className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-900 font-bold text-[11px] focus:bg-white focus:border-[#800020]/30 outline-none transition-all shadow-[inset_0_2px_8px_rgba(0,0,0,0.02)]" value={formData.instagram || ''} onChange={e => setFormData({ ...formData, instagram: e.target.value })} />
          </div>
          <button type="submit" className="w-full bg-[#800020] text-white py-6 rounded-3xl font-black uppercase tracking-widest text-[11px] mt-8 hover:bg-[#600018] shadow-lg shadow-red-900/10 transition-all hover:-translate-y-0.5">
            {editingClient ? 'Salvar Alterações' : 'Concluir Cadastro FARMASI'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
