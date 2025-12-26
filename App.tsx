import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { Session } from '@supabase/supabase-js';
import { Layout } from './components/Layout';
import { storage } from './services/storage';
import { api } from './services/api';
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

  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [salons, setSalons] = useState<Salon[]>([]);
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const persistData = (type: 'products' | 'clients' | 'salons' | 'consignments' | 'sales', data: any[]) => {
    switch (type) {
      case 'products': storage.saveProducts(data as Product[]); break;
      case 'clients': storage.saveClients(data as Client[]); break;
      case 'salons': storage.saveSalons(data as Salon[]); break;
      case 'consignments': storage.saveConsignments(data as Consignment[]); break;
      case 'sales': storage.saveSales(data as Sale[]); break;
    }

    const apiUrl = storage.getApiUrl();
    if (apiUrl) {
      api.saveData(apiUrl, type, data).catch(err => console.error("Erro na Sincronização Cloud:", err));
    }
  };

  const syncFromCloud = async (url: string) => {
    setIsLoading(true);
    try {
      const [p, c, s, co, sa] = await Promise.all([
        api.fetchData(url, 'products'),
        api.fetchData(url, 'clients'),
        api.fetchData(url, 'salons'),
        api.fetchData(url, 'consignments'),
        api.fetchData(url, 'sales')
      ]);

      if (p && Array.isArray(p)) { setProducts(p); storage.saveProducts(p); }
      if (c && Array.isArray(c)) { setClients(c); storage.saveClients(c); }
      if (s && Array.isArray(s)) { setSalons(s); storage.saveSalons(s); }
      if (co && Array.isArray(co)) { setConsignments(co); storage.saveConsignments(co); }
      if (sa && Array.isArray(sa)) { setSales(sa); storage.saveSales(sa); }
    } catch (e) {
      console.error("Falha ao Sincronizar dados da nuvem", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncConfig = (url: string) => {
    storage.saveApiUrl(url);
    if (url) syncFromCloud(url);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    setProducts(storage.getProducts());
    setClients(storage.getClients());
    setSalons(storage.getSalons());
    setConsignments(storage.getConsignments());
    setSales(storage.getSales());

    const apiUrl = storage.getApiUrl();
    if (apiUrl) syncFromCloud(apiUrl);
  }, [session]);

  const handleViewChange = (view: ViewState) => {
    setCurrentView(view);
    setAutoOpenModal(false);
  };

  const handleQuickAction = (view: ViewState) => {
    setCurrentView(view);
    setAutoOpenModal(true);
  };

  // Função Centralizada e Robusta de Deleção
  const executeDeletion = async (type: 'products' | 'clients' | 'salons' | 'sales' | 'consignments', id: string) => {
    const tid = String(id);

    // 1. Atualiza o Estado Local IMEDIATAMENTE para UX fluida
    if (type === 'products') setProducts(prev => prev.filter(item => String(item.id) !== tid));
    if (type === 'clients') setClients(prev => prev.filter(item => String(item.id) !== tid));
    if (type === 'salons') setSalons(prev => prev.filter(item => String(item.id) !== tid));
    if (type === 'sales') setSales(prev => prev.filter(item => String(item.id) !== tid));
    if (type === 'consignments') setConsignments(prev => prev.filter(item => String(item.id) !== tid));

    // 2. Atualiza o LocalStorage
    const currentData = JSON.parse(localStorage.getItem(`luzi_${type}`) || '[]');
    const filteredData = currentData.filter((item: any) => String(item.id) !== tid);
    localStorage.setItem(`luzi_${type}`, JSON.stringify(filteredData));

    // 3. Sincroniza com a Nuvem (API)
    const apiUrl = storage.getApiUrl();
    if (apiUrl) {
      try {
        await api.deleteRecord(apiUrl, type, tid);
      } catch (err) {
        console.error(`Erro ao deletar ${type} na nuvem:`, err);
      }
    }
  };

  const handleDeleteProduct = (id: string) => executeDeletion('products', id);

  // Deleta venda COM reversão de estoque
  const handleDeleteSale = (id: string) => {
    const saleToDelete = sales.find(s => String(s.id) === String(id));

    if (saleToDelete) {
      // Reverte o estoque dos produtos da venda
      setProducts(prev => {
        let updatedProducts = [...prev];
        saleToDelete.items.forEach(item => {
          if (saleToDelete.type === 'direct') {
            // Venda direta: devolve para stockQuantity
            updatedProducts = updatedProducts.map(p =>
              String(p.id) === String(item.productId)
                ? { ...p, stockQuantity: p.stockQuantity + item.quantity }
                : p
            );
          } else if (saleToDelete.type === 'consignment' && saleToDelete.originSalonId) {
            // Venda consignada: devolve para consignedQuantity
            updatedProducts = updatedProducts.map(p =>
              String(p.id) === String(item.productId)
                ? { ...p, consignedQuantity: p.consignedQuantity + item.quantity }
                : p
            );
          }
        });
        persistData('products', updatedProducts);
        return updatedProducts;
      });
    }

    // Agora deleta a venda
    executeDeletion('sales', id);
  };

  const handleDeleteSalon = (id: string) => executeDeletion('salons', id);
  const handleDeleteClient = (id: string) => executeDeletion('clients', id);
  const handleDeleteConsignment = (id: string) => executeDeletion('consignments', id);

  const handleImportProducts = (newProducts: Product[]) => {
    setProducts(prev => {
      const updatedList = [...prev];
      newProducts.forEach(importedP => {
        const existingIdx = updatedList.findIndex(p => String(p.code) === String(importedP.code));
        if (existingIdx !== -1) {
          updatedList[existingIdx] = {
            ...updatedList[existingIdx],
            name: importedP.name || updatedList[existingIdx].name,
            costPrice: importedP.costPrice || updatedList[existingIdx].costPrice,
            sellPrice: importedP.sellPrice || updatedList[existingIdx].sellPrice,
            stockQuantity: importedP.stockQuantity
          };
        } else {
          updatedList.push(importedP);
        }
      });
      persistData('products', updatedList);
      return updatedList;
    });
  };

  const handleAddProduct = (prod: Product) => {
    setProducts(prev => {
      const newList = [...prev, prod];
      persistData('products', newList);
      return newList;
    });
  };

  const handleEditProduct = (prod: Product) => {
    setProducts(prev => {
      const newList = prev.map(p => String(p.id) === String(prod.id) ? prod : p);
      persistData('products', newList);
      return newList;
    });
  };

  const handleAddSale = (sale: Sale) => {
    setSales(prev => {
      const newList = [...prev, sale];
      persistData('sales', newList);
      return newList;
    });

    setProducts(prev => {
      let updatedProducts = [...prev];
      sale.items.forEach(item => {
        if (sale.type === 'direct') {
          updatedProducts = updatedProducts.map(p =>
            String(p.id) === String(item.productId)
              ? { ...p, stockQuantity: p.stockQuantity - item.quantity }
              : p
          );
        } else if (sale.type === 'consignment' && sale.originSalonId) {
          updatedProducts = updatedProducts.map(p =>
            String(p.id) === String(item.productId)
              ? { ...p, consignedQuantity: p.consignedQuantity - item.quantity }
              : p
          );
        }
      });
      persistData('products', updatedProducts);
      return updatedProducts;
    });
  };

  // Edita uma venda existente com ajuste de estoque
  const handleEditSale = (updatedSale: Sale) => {
    const originalSale = sales.find(s => String(s.id) === String(updatedSale.id));

    if (originalSale) {
      setProducts(prev => {
        let updatedProducts = [...prev];

        // 1. Reverte o estoque da venda original
        originalSale.items.forEach(item => {
          if (originalSale.type === 'direct') {
            updatedProducts = updatedProducts.map(p =>
              String(p.id) === String(item.productId)
                ? { ...p, stockQuantity: p.stockQuantity + item.quantity }
                : p
            );
          } else if (originalSale.type === 'consignment' && originalSale.originSalonId) {
            updatedProducts = updatedProducts.map(p =>
              String(p.id) === String(item.productId)
                ? { ...p, consignedQuantity: p.consignedQuantity + item.quantity }
                : p
            );
          }
        });

        // 2. Aplica o estoque da nova venda
        updatedSale.items.forEach(item => {
          if (updatedSale.type === 'direct') {
            updatedProducts = updatedProducts.map(p =>
              String(p.id) === String(item.productId)
                ? { ...p, stockQuantity: p.stockQuantity - item.quantity }
                : p
            );
          } else if (updatedSale.type === 'consignment' && updatedSale.originSalonId) {
            updatedProducts = updatedProducts.map(p =>
              String(p.id) === String(item.productId)
                ? { ...p, consignedQuantity: p.consignedQuantity - item.quantity }
                : p
            );
          }
        });

        persistData('products', updatedProducts);
        return updatedProducts;
      });
    }

    setSales(prev => {
      const newList = prev.map(s => String(s.id) === String(updatedSale.id) ? updatedSale : s);
      persistData('sales', newList);
      return newList;
    });
  };

  const handleAddConsignment = (consignment: Consignment) => {
    setConsignments(prev => {
      const newList = [...prev, consignment];
      persistData('consignments', newList);
      return newList;
    });

    setProducts(prev => {
      const updatedProducts = prev.map(p => {
        if (String(p.id) === String(consignment.productId)) {
          return {
            ...p,
            stockQuantity: p.stockQuantity - consignment.quantity,
            consignedQuantity: p.consignedQuantity + consignment.quantity
          };
        }
        return p;
      });
      persistData('products', updatedProducts);
      return updatedProducts;
    });
  };

  const handleAddSalon = (salon: Salon) => {
    setSalons(prev => {
      const newList = [...prev, salon];
      persistData('salons', newList);
      return newList;
    });
  };

  const handleEditSalon = (salon: Salon) => {
    setSalons(prev => {
      const newList = prev.map(s => String(s.id) === String(salon.id) ? salon : s);
      persistData('salons', newList);
      return newList;
    });
  };

  const handleAddClient = (client: Client) => {
    setClients(prev => {
      const newList = [...prev, client];
      persistData('clients', newList);
      return newList;
    });
  };

  const handleEditClient = (client: Client) => {
    setClients(prev => {
      const newList = prev.map(c => String(c.id) === String(client.id) ? client : c);
      persistData('clients', newList);
      return newList;
    });
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-400"></div>
          <span className="text-slate-950 font-bold uppercase text-xs tracking-widest text-center px-6">
            Sincronizando Studio Luzi...
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
          onImportProducts={handleImportProducts}
        />;
      case 'inventory':
        return <Inventory products={products} onAdd={handleAddProduct} onEdit={handleEditProduct} onDelete={handleDeleteProduct} startOpen={autoOpenModal} />;
      case 'sales':
        return <Sales sales={sales} products={products} clients={clients} salons={salons} consignments={consignments} onAddSale={handleAddSale} onEditSale={handleEditSale} onDelete={handleDeleteSale} startOpen={autoOpenModal} />;
      case 'consignments':
        return <Consignments consignments={consignments} salons={salons} products={products} onAdd={handleAddConsignment} onEdit={() => { }} onDelete={handleDeleteConsignment} startOpen={autoOpenModal} />;
      case 'salons':
        return <Salons salons={salons} sales={sales} onAdd={handleAddSalon} onEdit={handleEditSalon} onDelete={handleDeleteSalon} onPayCommission={() => { }} startOpen={autoOpenModal} />;
      case 'clients':
        return <Clients clients={clients} onAdd={handleAddClient} onEdit={handleEditClient} onDelete={handleDeleteClient} startOpen={autoOpenModal} />;
      case 'reports':
        return <Reports sales={sales} products={products} salons={salons} />;
      default: return null;
    }
  };

  if (!session) {
    return <Auth />;
  }

  return <Layout currentView={currentView} onChangeView={handleViewChange}>{renderContent()}</Layout>;
}

export default App;
