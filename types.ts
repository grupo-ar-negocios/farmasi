
export interface Product {
  id: string;
  code: string;
  name: string;
  costPrice: number;
  sellPrice: number;
  stockQuantity: number;
  consignedQuantity: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  instagram?: string;
}

export interface Salon {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  commissionRate: number; // Percentage (0-100)
}

export interface Consignment {
  id: string;
  salonId: string;
  productId: string;
  quantity: number;
  soldQuantity: number;
  returnedQuantity: number;
  status: 'active' | 'settled';
  date: string;
}

export interface Sale {
  id: string;
  date: string;
  clientId: string;
  items: SaleItem[];
  totalValue: number;
  totalCost: number;
  paymentMethod: 'cash' | 'pix' | 'credit' | 'debit';
  type: 'direct' | 'consignment';
  originSalonId?: string; // If consignment
  commissionPaid?: boolean; // New field to track if commission was settled with the salon
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export type ViewState = 'dashboard' | 'sales' | 'inventory' | 'consignments' | 'salons' | 'clients' | 'reports';
