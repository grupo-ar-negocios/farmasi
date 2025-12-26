import { Product, Client, Salon, Consignment, Sale } from '../types';

export type DataType = 'products' | 'clients' | 'salons' | 'consignments' | 'sales';
type DataTypeMap = {
  products: Product;
  clients: Client;
  salons: Salon;
  consignments: Consignment;
  sales: Sale;
};

export const api = {
  // Envia dados para a planilha (Salvar/Atualizar lista completa)
  saveData: async <T extends DataType>(url: string, type: T, data: DataTypeMap[T][]) => {
    try {
      // Usamos POST padrão. Se houver erro de CORS, o Google Apps Script 
      // geralmente ainda processa a requisição se estiver configurado como "Anyone".
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Usar text/plain evita pre-flight CORS em alguns casos mas permite enviar JSON
        },
        body: JSON.stringify({ action: 'save', type, items: data })
      });
      return true;
    } catch (error) {
      console.error("Erro ao salvar no Google Sheets:", error);
      return false;
    }
  },

  // Exclui um registro específico na planilha por ID
  deleteRecord: async (url: string, type: string, id: string) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'delete',
          type: type,
          id: String(id)
        })
      });
      return true;
    } catch (error) {
      console.error(`Erro ao deletar ${type} no Google Sheets:`, error);
      return false;
    }
  },

  // Busca dados da planilha
  fetchData: async <T extends DataType>(url: string, type: T): Promise<DataTypeMap[T][] | null> => {
    try {
      const response = await fetch(`${url}?type=${type}`);
      if (!response.ok) throw new Error('Falha na resposta da rede');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Erro ao buscar ${type} do Google Sheets:`, error);
      return null;
    }
  }
};
