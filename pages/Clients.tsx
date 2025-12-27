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

    console.log("Clients UI: handleSubmit - Dados do formulário:", clientData);

    if (editingClient) {
      console.log("Clients UI: Modo edição, ID:", editingClient.id);
      clientData.id = editingClient.id;
      onEdit(clientData as Client);
    } else {
      console.log("Clients UI: Modo criação");
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
        <h2 className="text-3xl font-black text-slate-950 flex items-center gap-3 uppercase">
          <Users className="text-rose-500" size={32} /> Clientes
        </h2>
        <button onClick={handleOpenAdd} className="bg-slate-950 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 hover:bg-black transition-all">
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="PESQUISAR POR NOME OU WHATSAPP..."
          className="w-full pl-12 pr-6 py-5 bg-[#fffafa] border-2 border-rose-50 rounded-2xl text-slate-950 font-black text-[12px] uppercase focus:outline-none focus:border-rose-400 shadow-sm transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white p-8 rounded-[2.5rem] border border-rose-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button onClick={() => handleOpenEdit(client)} className="p-3 text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100"><Edit2 size={20} /></button>
              <button onClick={() => { if (confirm(`Excluir permanentemente o cliente "${client.name}"?`)) onDelete(client.id); }} className="p-3 text-rose-600 bg-rose-50 rounded-xl hover:bg-rose-100"><Trash2 size={20} /></button>
            </div>

            <div className="flex items-center gap-5 mb-8">
              <div className="w-16 h-16 bg-[#fffafa] rounded-[1.25rem] border border-rose-100 flex items-center justify-center text-rose-400 font-black text-2xl shadow-inner">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-black text-slate-950 uppercase text-lg leading-tight">{client.name}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Cadastro Ativo</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 text-xs text-slate-950 font-bold bg-[#fffafa] p-4 rounded-2xl border border-rose-50">
                <Phone size={16} className="text-rose-400" /> {client.phone}
              </div>
              {client.instagram && (
                <div className="flex items-center gap-4 text-xs text-slate-950 font-bold bg-[#fffafa] p-4 rounded-2xl border border-rose-50">
                  <Instagram size={16} className="text-pink-500" /> {client.instagram}
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingClient ? "Editar Cadastro" : "Adicionar Cliente"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[11px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Nome Completo</label>
            <input required className="w-full p-5 bg-[#fffafa] border-2 border-rose-50 rounded-2xl text-slate-950 font-black uppercase text-xs focus:bg-white focus:border-rose-400 outline-none transition-all shadow-inner" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-500 uppercase mb-2 block tracking-widest">WhatsApp / Celular</label>
            <input required className="w-full p-5 bg-[#fffafa] border-2 border-rose-50 rounded-2xl text-slate-950 font-black text-xs focus:bg-white focus:border-rose-400 outline-none transition-all shadow-inner" value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
          </div>
          <div>
            <label className="text-[11px] font-black text-slate-500 uppercase mb-2 block tracking-widest">Instagram (Opcional)</label>
            <input placeholder="@exemplo" className="w-full p-5 bg-[#fffafa] border-2 border-rose-50 rounded-2xl text-slate-950 font-black text-xs focus:bg-white focus:border-rose-400 outline-none transition-all shadow-inner" value={formData.instagram || ''} onChange={e => setFormData({ ...formData, instagram: e.target.value })} />
          </div>
          <button type="submit" className="w-full bg-slate-950 text-white py-6 rounded-3xl font-black uppercase tracking-widest text-[12px] mt-8 hover:bg-black transition-all">
            {editingClient ? 'Salvar Alterações' : 'Concluir Cadastro'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
