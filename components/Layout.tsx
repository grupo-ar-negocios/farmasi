
import React from 'react';
import { ViewState } from '../types';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Handshake,
  Store,
  Users,
  Menu,
  X,
  BarChart3,
  LogOut
} from 'lucide-react';
import { supabase } from '../services/supabase';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

interface NavItemProps {
  view: ViewState;
  current: ViewState;
  icon: React.ElementType;
  label: string;
  onClick: (v: ViewState) => void;
}

const NavItem: React.FC<NavItemProps> = ({
  view,
  current,
  icon: Icon,
  label,
  onClick
}) => {
  const isActive = view === current;
  return (
    <button
      onClick={() => onClick(view)}
      className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-300 ${isActive
        ? 'bg-[#800020] text-white shadow-lg shadow-red-900/10 scale-[1.02]'
        : 'text-slate-500 hover:bg-slate-50 hover:text-[#800020]'
        }`}
    >
      <Icon size={20} className={isActive ? 'text-[#D4AF37]' : ''} />
      <span className={`font-semibold text-sm tracking-tight ${isActive ? 'text-white' : ''}`}>{label}</span>
    </button>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { view: 'dashboard' as ViewState, label: 'Dashboard', icon: LayoutDashboard },
    { view: 'sales' as ViewState, label: 'Vendas', icon: ShoppingCart },
    { view: 'inventory' as ViewState, label: 'Estoque', icon: Package },
    { view: 'consignments' as ViewState, label: 'Consignados', icon: Handshake },
    { view: 'salons' as ViewState, label: 'Salões', icon: Store },
    { view: 'clients' as ViewState, label: 'Clientes', icon: Users },
    { view: 'reports' as ViewState, label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-[#fffafb] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 h-full p-6 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="mb-10">
          <h1 className="text-3xl font-black text-[#800020] tracking-tighter leading-none">
            FARMASI
          </h1>
          <p className="text-[9px] text-[#D4AF37] font-bold tracking-[0.4em] mt-2 uppercase">Sistema de Gestão</p>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.view}
              {...item}
              current={currentView}
              onClick={onChangeView}
            />
          ))}
        </nav>

        <div className="pt-4 border-t border-rose-50">
          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium text-sm">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-xl z-50 border-b border-slate-100 px-6 py-4 flex justify-between items-center shadow-sm">
        <h1 className="text-xl font-black text-[#800020] tracking-tighter">FARMASI</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white pt-20 px-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <NavItem
                key={item.view}
                {...item}
                current={currentView}
                onClick={(v) => {
                  onChangeView(v);
                  setIsMobileMenuOpen(false);
                }}
              />
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 h-full overflow-y-auto pt-16 md:pt-0 scroll-smooth">
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
};
