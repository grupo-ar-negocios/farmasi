import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import { Layout } from './components/Layout';
import { supabaseService } from './services/supabaseService';
import { Auth } from './pages/Auth';
import {
  Product,
  Client,
  Salon,
  Consignment,
  Sale,
  ViewState
} from './types';

// Page Components
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Sales } from './pages/Sales';
import { Consignments } from './pages/Consignments';
import { Salons } from './pages/Salons';
import { Clients } from './pages/Clients';
import { Reports } from './pages/Reports';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [autoOpenModal, setAutoOpenModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [p, c, s, co, sa] = await Promise.all([
        supabaseService.getProducts(),
        supabaseService.getClients(),
        supabaseService.getSalons(),
        supabaseService.getConsignments(),
        supabaseService.getSales()
      ]);

      setProducts(p);
      setClients(c);
      setSalons(s);
      setConsignments(co);
      setSales(sa);
    } catch (e) {
      console.error("Erro ao carregar dados do Supabase", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkApproval(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkApproval(session.user.id);
      else setIsApproved(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkApproval = async (userId: string) => {
    const profile = await supabaseService.getProfile(userId);
    if (profile) {
      setIsApproved(profile.is_approved);
    } else {
      setIsApproved(false);
    }
  };

  useEffect(() => {
    if (session && isApproved) {
      refreshData();

      // Subscribe to real-time changes
      const channel = supabase
        .channel('db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          () => refreshData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'sales' },
          () => refreshData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'clients' },
          () => refreshData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'salons' },
          () => refreshData()
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'consignments' },
          () => refreshData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session, isApproved, refreshData]);

  // Real-time approval listener
  useEffect(() => {
    if (session && isApproved === false) {
      const channel = supabase
        .channel('approval-check')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` },
          (payload) => {
            if (payload.new && (payload.new as any).is_approved) {
              setIsApproved(true);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [session, isApproved]);

  const handleViewChange = (view: ViewState) => {
    setCurrentView(view);
    setAutoOpenModal(false);
  };

  const handleQuickAction = (view: ViewState) => {
    setCurrentView(view);
    setAutoOpenModal(true);
  };

  const executeDeletion = async (type: 'products' | 'clients' | 'salons' | 'sales' | 'consignments', id: string) => {
    try {
      if (type === 'products') await supabaseService.deleteProduct(id);
      if (type === 'clients') await supabaseService.deleteClient(id);
      if (type === 'salons') await supabaseService.deleteSalon(id);
      if (type === 'sales') await supabaseService.deleteSale(id);
      if (type === 'consignments') await supabaseService.deleteConsignment(id);

      refreshData();
    } catch (err) {
      console.error(`Erro ao deletar ${type}:`, err);
    }
  };

  const handleDeleteProduct = (id: string) => executeDeletion('products', id);

  const handleDeleteSale = async (id: string) => {
    const saleToDelete = sales.find(s => String(s.id) === String(id));

    if (saleToDelete) {
      try {
        // Reverte o estoque dos produtos e consignações
        for (const item of saleToDelete.items) {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            const updatedProduct = { ...product };
            if (saleToDelete.type === 'direct') {
              updatedProduct.stockQuantity += item.quantity;
              await supabaseService.updateProduct(updatedProduct);
            } else if (saleToDelete.type === 'consignment' && saleToDelete.originSalonId) {
              updatedProduct.consignedQuantity += item.quantity;
              await supabaseService.updateProduct(updatedProduct);

              // Reverte soldQuantity na consignação (FIFO invertido - LIFO para reversão simplificada)
              const relevantConsignments = consignments
                .filter(c => String(c.salonId) === String(saleToDelete.originSalonId) && String(c.productId) === String(item.productId))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

              let remainingToRevert = item.quantity;
              for (const consignment of relevantConsignments) {
                if (remainingToRevert <= 0) break;
                const revertAmount = Math.min(remainingToRevert, consignment.soldQuantity);
                if (revertAmount > 0) {
                  await supabaseService.updateConsignment({
                    ...consignment,
                    soldQuantity: consignment.soldQuantity - revertAmount
                  });
                  remainingToRevert -= revertAmount;
                }
              }
            }
          }
        }

        await supabaseService.deleteSale(id);
        refreshData();
      } catch (err) {
        console.error("Erro ao deletar venda e reverter estoque:", err);
      }
    }
  };

  const handleDeleteSalon = (id: string) => executeDeletion('salons', id);
  const handleDeleteClient = (id: string) => executeDeletion('clients', id);
  const handleDeleteConsignment = (id: string) => executeDeletion('consignments', id);

  const handleImportProducts = async (newProducts: Product[]) => {
    try {
      await supabaseService.createProducts(newProducts);
      refreshData();
    } catch (e) {
      console.error("Erro ao importar produtos:", e);
      alert("Erro ao importar produtos. Verifique o console.");
    }
  };

  const handleAddProduct = async (prod: Omit<Product, 'id'>) => {
    setAutoOpenModal(false);
    try {
      await supabaseService.createProduct(prod);
      refreshData();
    } catch (e) {
      console.error("Erro ao adicionar produto", e);
    }
  };

  const handleEditProduct = async (prod: Product) => {
    try {
      await supabaseService.updateProduct(prod);
      refreshData();
    } catch (e) {
      console.error("Erro ao editar produto", e);
    }
  };

  const handleAddSale = async (sale: Omit<Sale, 'id'>) => {
    setAutoOpenModal(false);
    try {
      // 1. Criar a venda e itens
      await supabaseService.createSale(sale);

      // 2. Atualizar estoque e consignações
      const updates = sale.items.map(async (item) => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const updatedProduct = { ...product };
          if (sale.type === 'direct') {
            updatedProduct.stockQuantity -= item.quantity;
            return supabaseService.updateProduct(updatedProduct);
          } else if (sale.type === 'consignment' && sale.originSalonId) {
            updatedProduct.consignedQuantity -= item.quantity;

            // Atualiza soldQuantity na consignação
            const relevantConsignments = consignments
              .filter(c => String(c.salonId) === String(sale.originSalonId) && String(c.productId) === String(item.productId) && c.status === 'active')
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            let remainingToUpdate = item.quantity;
            const consignmentUpdates = [];

            for (const consignment of relevantConsignments) {
              if (remainingToUpdate <= 0) break;
              const availableInConsignment = consignment.quantity - consignment.soldQuantity - consignment.returnedQuantity;
              const updateAmount = Math.min(remainingToUpdate, availableInConsignment);

              if (updateAmount > 0) {
                consignmentUpdates.push(supabaseService.updateConsignment({
                  ...consignment,
                  soldQuantity: consignment.soldQuantity + updateAmount
                }));
                remainingToUpdate -= updateAmount;
              }
            }

            return Promise.all([
              supabaseService.updateProduct(updatedProduct),
              ...consignmentUpdates
            ]);
          }
        }
      });

      await Promise.all(updates);
      refreshData();
    } catch (e) {
      console.error("Erro ao adicionar venda:", e);
      alert("Não foi possível salvar a venda. Verifique sua conexão ou dados.");
    }
  };

  const handleEditSale = async (updatedSale: Sale) => {
    // For simplicity in this v1, delete and recreate or just refresh after manual fix
    // Real implementation would revert old sale stock and apply new sale stock
    console.warn("Edit sale directly in Supabase recommended for complex stock adjustments");
    refreshData();
  };

  const handleAddConsignment = async (consignment: Omit<Consignment, 'id'>) => {
    setAutoOpenModal(false);
    try {
      await supabaseService.createConsignment(consignment);

      const product = products.find(p => p.id === consignment.productId);
      if (product) {
        await supabaseService.updateProduct({
          ...product,
          stockQuantity: product.stockQuantity - consignment.quantity,
          consignedQuantity: product.consignedQuantity + consignment.quantity
        });
      }

      refreshData();
    } catch (e) {
      console.error("Erro ao adicionar consignação", e);
    }
  };

  const handleAddSalon = async (salon: Omit<Salon, 'id'>) => {
    setAutoOpenModal(false);
    try {
      await supabaseService.createSalon(salon);
      refreshData();
    } catch (e) {
      console.error("Erro ao adicionar salão", e);
    }
  };

  const handleEditSalon = async (salon: Salon) => {
    try {
      await supabaseService.updateSalon(salon);
      refreshData();
    } catch (e) {
      console.error("Erro ao editar salão", e);
    }
  };

  const handleAddClient = async (client: Omit<Client, 'id'>) => {
    setAutoOpenModal(false);
    try {
      await supabaseService.createClient(client);
      refreshData();
    } catch (e) {
      console.error("Erro ao adicionar cliente", e);
    }
  };

  const handleEditClient = async (client: Client) => {
    try {
      await supabaseService.updateClient(client);
      refreshData();
    } catch (e) {
      console.error("Erro ao editar cliente", e);
    }
  };

  const handlePayCommission = async (salonId: string, salesIdsToPay: string[]) => {
    try {
      const updates = salesIdsToPay.map(id => {
        const sale = sales.find(s => s.id === id);
        if (sale) {
          return supabaseService.updateSale({ ...sale, commissionPaid: true });
        }
        return Promise.resolve();
      });
      await Promise.all(updates);
      refreshData();
    } catch (e) {
      console.error("Erro ao pagar comissão", e);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400"></div>
          <span className="text-slate-950 font-bold uppercase text-xs tracking-widest text-center px-6">
            Sincronizando FARMASI...
          </span>
        </div>
      );
    }
    switch (currentView) {
      case 'dashboard':
        return <Dashboard
          sales={sales}
          products={products}
          consignments={consignments}
          salons={salons}
          onQuickAction={handleQuickAction}
          onViewChange={handleViewChange}
          onImportProducts={handleImportProducts}
        />;
      case 'inventory':
        return <Inventory products={products} onAdd={handleAddProduct} onEdit={handleEditProduct} onDelete={handleDeleteProduct} startOpen={autoOpenModal} />;
      case 'sales':
        return <Sales sales={sales} products={products} clients={clients} salons={salons} consignments={consignments} onAddSale={handleAddSale} onEditSale={handleEditSale} onDelete={handleDeleteSale} startOpen={autoOpenModal} />;
      case 'consignments':
        return <Consignments consignments={consignments} salons={salons} products={products} onAdd={handleAddConsignment} onEdit={() => { }} onDelete={handleDeleteConsignment} startOpen={autoOpenModal} />;
      case 'salons':
        return <Salons salons={salons} sales={sales} onAdd={handleAddSalon} onEdit={handleEditSalon} onDelete={handleDeleteSalon} onPayCommission={handlePayCommission} startOpen={autoOpenModal} />;
      case 'clients':
        return <Clients clients={clients} sales={sales} onAdd={handleAddClient} onEdit={handleEditClient} onDelete={handleDeleteClient} startOpen={autoOpenModal} />;
      case 'reports':
        return <Reports sales={sales} products={products} salons={salons} />;
      default: return null;
    }
  };

  if (!session) {
    return <Auth />;
  }

  if (isApproved === false) {
    return (
      <div className="min-h-screen bg-[#fffafb] flex items-center justify-center p-4">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-rose-100 text-center max-w-md animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-2xl font-black text-slate-950 uppercase tracking-tight mb-4">Acesso Pendente</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
            Seu cadastro foi recebido com sucesso! Por segurança, novos acessos precisam ser aprovados pelo administrador.
          </p>
          <div className="bg-[#fffafa] p-6 rounded-2xl border border-rose-50 mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status do Perfil</p>
            <p className="text-rose-500 font-black uppercase text-xs">Aguardando Aprovação de @ar-negocios</p>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  if (isApproved === null) {
    return (
      <div className="min-h-screen bg-[#fffafb] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return <Layout currentView={currentView} onChangeView={handleViewChange}>{renderContent()}</Layout>;
}

export default App;
