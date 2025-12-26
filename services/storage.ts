
import { Product, Client, Salon, Consignment, Sale } from '../types';
import * as XLSX from 'xlsx';

const STORAGE_KEYS = {
  PRODUCTS: 'luzi_products',
  CLIENTS: 'luzi_clients',
  SALONS: 'luzi_salons',
  CONSIGNMENTS: 'luzi_consignments',
  SALES: 'luzi_sales',
  API_URL: 'luzi_api_url',
};

// Normalização para comparação de cabeçalhos - remove acentos, espaços, parênteses, símbolos
const norm = (s: any) => String(s || '').toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s\(\)\$\%\.\,\-\_]/g, '');

// Parser de números robusto para o seu formato específico: R$ 1.234,56 ou 53,00
const parseNum = (val: any): number => {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  // Limpa R$, espaços e pontos de milhar, troca vírgula por ponto
  let s = String(val)
    .replace('R$', '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

export const storage = {
  getApiUrl: (): string | null => localStorage.getItem(STORAGE_KEYS.API_URL),
  saveApiUrl: (url: string) => localStorage.setItem(STORAGE_KEYS.API_URL, url),

  getProducts: (): Product[] => {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
  },
  saveProducts: (data: Product[]) => localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data)),

  getClients: (): Client[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return data ? JSON.parse(data) : [];
  },
  saveClients: (data: Client[]) => localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(data)),

  getSalons: (): Salon[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SALONS);
    return data ? JSON.parse(data) : [];
  },
  saveSalons: (data: Salon[]) => localStorage.setItem(STORAGE_KEYS.SALONS, JSON.stringify(data)),

  getConsignments: (): Consignment[] => {
    const data = localStorage.getItem(STORAGE_KEYS.CONSIGNMENTS);
    return data ? JSON.parse(data) : [];
  },
  saveConsignments: (data: Consignment[]) => localStorage.setItem(STORAGE_KEYS.CONSIGNMENTS, JSON.stringify(data)),

  getSales: (): Sale[] => {
    const data = localStorage.getItem(STORAGE_KEYS.SALES);
    return data ? JSON.parse(data) : [];
  },
  saveSales: (data: Sale[]) => localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(data)),

  exportToExcel: (products: Product[]) => {
    const wb = XLSX.utils.book_new();
    const wsProducts = XLSX.utils.json_to_sheet(products);
    XLSX.utils.book_append_sheet(wb, wsProducts, "Estoque");
    XLSX.writeFile(wb, `StudioLuzi_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`);
  },

  parseProductsFromExcel: (file: File, onProgress?: (p: number) => void): Promise<Product[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          if (onProgress) onProgress(30);
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          if (onProgress) onProgress(60);

          // Lendo como matriz para detectar o cabeçalho em qualquer linha
          const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

          let headerRowIndex = -1;
          for (let i = 0; i < matrix.length; i++) {
            const row = matrix[i];
            if (row && row.some(cell => {
              const n = norm(cell);
              return n === 'codigo' || n === 'nome' || n === 'produto';
            })) {
              headerRowIndex = i;
              break;
            }
          }

          if (headerRowIndex === -1) {
            throw new Error("Colunas 'Código' ou 'Nome' não encontradas.");
          }

          const headers = matrix[headerRowIndex].map(h => norm(h));

          // Função auxiliar para verificar se o header contém algum dos termos
          const headerContains = (h: string, ...terms: string[]) => terms.some(t => h.includes(t));

          const colMap = {
            code: headers.findIndex(h => h === 'codigo' || h === 'cod' || h === 'sku' || h === 'ref' || h === 'referencia'),
            name: headers.findIndex(h => headerContains(h, 'nome', 'produto', 'descricao', 'item')),
            cost: headers.findIndex(h => headerContains(h, 'custo', 'pc')),
            sell: headers.findIndex(h => headerContains(h, 'venda', 'preco', 'valor', 'pv') && !h.includes('custo')),
            stock: headers.findIndex(h => headerContains(h, 'estoque', 'qtd', 'quantidade', 'saldo', 'disponivel', 'unidade'))
          };

          const products: Product[] = [];
          for (let i = headerRowIndex + 1; i < matrix.length; i++) {
            const row = matrix[i];
            if (!row || row.length === 0) continue;

            const name = colMap.name !== -1 ? String(row[colMap.name] || '').trim() : '';
            // Força o código a ser string para manter os zeros à esquerda (0001)
            const code = colMap.code !== -1 ? String(row[colMap.code] ?? '').trim() : '';

            if (!name && !code) continue;

            // Parse dos valores de preço
            const sellPrice = colMap.sell !== -1 ? parseNum(row[colMap.sell]) : 0;
            const costPrice = colMap.cost !== -1 ? parseNum(row[colMap.cost]) : sellPrice; // Fallback: usa preço de venda como custo se não tiver coluna custo
            const stockQuantity = colMap.stock !== -1 ? parseNum(row[colMap.stock]) : 0;

            products.push({
              id: `imp-${Date.now()}-${i}`,
              code: code || `ID-${i}`,
              name: name || 'Produto s/ Nome',
              costPrice,
              sellPrice: sellPrice || costPrice, // Se não tiver venda, usa custo
              stockQuantity,
              consignedQuantity: 0
            });
          }

          if (onProgress) onProgress(100);
          resolve(products);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }
};
