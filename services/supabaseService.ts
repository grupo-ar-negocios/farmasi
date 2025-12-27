import { supabase } from './supabase';
import { Product, Client, Salon, Consignment, Sale, SaleItem } from '../types';

export const supabaseService = {
    // Products
    getProducts: async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('name');
        if (error) throw error;
        return data.map(p => ({
            ...p,
            costPrice: p.cost_price,
            sellPrice: p.sell_price,
            stockQuantity: p.stock_quantity,
            consignedQuantity: p.consigned_quantity
        })) as Product[];
    },

    createProduct: async (product: Omit<Product, 'id'>) => {
        const { data, error } = await supabase
            .from('products')
            .insert([{
                code: product.code,
                name: product.name,
                cost_price: product.costPrice,
                sell_price: product.sellPrice,
                stock_quantity: product.stockQuantity,
                consigned_quantity: product.consignedQuantity
            }])
            .select()
            .single();
        if (error) {
            console.error("Erro ao criar produto:", error);
            throw error;
        }
        return data as Product;
    },

    createProducts: async (products: Omit<Product, 'id'>[]) => {
        const toInsert = products.map(p => ({
            code: p.code,
            name: p.name,
            cost_price: p.costPrice,
            sell_price: p.sellPrice,
            stock_quantity: p.stockQuantity,
            consigned_quantity: p.consignedQuantity
        }));
        const { error } = await supabase.from('products').insert(toInsert);
        if (error) {
            console.error("Erro ao importar produtos em lote:", error);
            throw error;
        }
    },

    updateProduct: async (product: Product) => {
        const { error } = await supabase
            .from('products')
            .update({
                code: product.code,
                name: product.name,
                cost_price: product.costPrice,
                sell_price: product.sellPrice,
                stock_quantity: product.stockQuantity,
                consigned_quantity: product.consignedQuantity
            })
            .eq('id', product.id);
        if (error) throw error;
    },

    deleteProduct: async (id: string) => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) throw error;
    },

    // Clients
    getClients: async () => {
        const { data, error } = await supabase.from('clients').select('*').order('name');
        if (error) throw error;
        return data as Client[];
    },

    createClient: async (client: Omit<Client, 'id'>) => {
        console.log("SupabaseService: Criando cliente com dados:", client);
        const { data, error } = await supabase
            .from('clients')
            .insert([{
                name: client.name,
                phone: client.phone,
                instagram: client.instagram
            }])
            .select()
            .single();
        if (error) {
            console.error("SupabaseService: Erro ao criar cliente:", error);
            throw error;
        }
        console.log("SupabaseService: Cliente criado com sucesso:", data);
        return data as Client;
    },

    updateClient: async (client: Client) => {
        const { error } = await supabase.from('clients').update(client).eq('id', client.id);
        if (error) throw error;
    },

    deleteClient: async (id: string) => {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) throw error;
    },

    // Salons
    getSalons: async () => {
        const { data, error } = await supabase.from('salons').select('*').order('name');
        if (error) throw error;
        return data.map(s => ({
            ...s,
            contactPerson: s.contact_person,
            commissionRate: s.commission_rate
        })) as Salon[];
    },

    createSalon: async (salon: Omit<Salon, 'id'>) => {
        const { data, error } = await supabase
            .from('salons')
            .insert([{
                name: salon.name,
                contact_person: salon.contactPerson,
                phone: salon.phone,
                address: salon.address,
                commission_rate: salon.commissionRate
            }])
            .select()
            .single();
        if (error) {
            console.error("Erro ao criar salão:", error);
            throw error;
        }
        return data as Salon;
    },

    updateSalon: async (salon: Salon) => {
        const { error } = await supabase
            .from('salons')
            .update({
                name: salon.name,
                contact_person: salon.contactPerson,
                phone: salon.phone,
                address: salon.address,
                commission_rate: salon.commissionRate
            })
            .eq('id', salon.id);
        if (error) throw error;
    },

    deleteSalon: async (id: string) => {
        const { error } = await supabase.from('salons').delete().eq('id', id);
        if (error) throw error;
    },

    // Consignments
    getConsignments: async () => {
        const { data, error } = await supabase.from('consignments').select('*').order('date', { ascending: false });
        if (error) throw error;
        return data.map(c => ({
            ...c,
            salonId: c.salon_id,
            productId: c.product_id,
            soldQuantity: c.sold_quantity,
            returnedQuantity: c.returned_quantity
        })) as Consignment[];
    },

    createConsignment: async (consignment: Omit<Consignment, 'id'>) => {
        const { data, error } = await supabase
            .from('consignments')
            .insert([{
                salon_id: consignment.salonId,
                product_id: consignment.productId,
                quantity: consignment.quantity,
                sold_quantity: consignment.soldQuantity,
                returned_quantity: consignment.returnedQuantity,
                status: consignment.status,
                date: consignment.date
            }])
            .select()
            .single();
        if (error) {
            console.error("Erro ao criar consignação:", error);
            throw error;
        }
        return data as Consignment;
    },

    deleteConsignment: async (id: string) => {
        const { error } = await supabase.from('consignments').delete().eq('id', id);
        if (error) throw error;
    },

    // Sales
    getSales: async () => {
        const { data, error } = await supabase
            .from('sales')
            .select('*, sale_items(*)')
            .order('date', { ascending: false });
        if (error) throw error;

        return data.map(s => ({
            ...s,
            clientId: s.client_id,
            totalValue: s.total_value,
            totalCost: s.total_cost,
            paymentMethod: s.payment_method,
            originSalonId: s.origin_salon_id,
            commissionPaid: s.commission_paid,
            items: s.sale_items.map((si: any) => ({
                productId: si.product_id,
                productName: si.product_name,
                quantity: si.quantity,
                unitPrice: si.unit_price,
                unitCost: si.unit_cost
            }))
        })) as Sale[];
    },

    createSale: async (sale: Omit<Sale, 'id'>) => {
        const { data: saleData, error: saleError } = await supabase
            .from('sales')
            .insert([{
                date: sale.date,
                client_id: sale.clientId,
                total_value: sale.totalValue,
                total_cost: sale.totalCost,
                payment_method: sale.paymentMethod,
                type: sale.type,
                origin_salon_id: sale.originSalonId,
                commission_paid: sale.commissionPaid
            }])
            .select()
            .single();

        if (saleError) {
            console.error("Erro ao criar venda (sales table):", saleError);
            throw saleError;
        }

        const itemsToInsert = sale.items.map(item => ({
            sale_id: saleData.id,
            product_id: item.productId,
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            unit_cost: item.unitCost
        }));

        const { error: itemsError } = await supabase.from('sale_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;

        return { ...sale, id: saleData.id } as Sale;
    },

    deleteSale: async (id: string) => {
        const { error } = await supabase.from('sales').delete().eq('id', id);
        if (error) throw error;
    },

    // Profiles
    getProfile: async (id: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
        if (error) return null;
        return data as { id: string; email: string; is_approved: boolean };
    }
};
