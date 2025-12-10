
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, FileText, Users, LogOut, Menu, X, UploadCloud, Github } from 'lucide-react';

const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
      to={to}
      onClick={() => setIsMobileMenuOpen(false)}
      className={({ isActive }) =>
        `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
          isActive
            ? 'bg-primary/10 text-primary border-r-4 border-primary'
            : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={20} className={isActive ? 'text-primary' : 'group-hover:text-white transition-colors'} />
          <span className="font-medium">{label}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-brand z-50 px-4 py-3 border-b border-white/10 flex justify-between items-center text-white">
         <div className="flex items-center gap-2">
            {/* Mobile Logo */}
            <img src="logo.png" alt="NossaFintech" className="h-8 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
            <div className="text-xl font-bold tracking-tight">
              Nossa<span className="text-primary">Fintech</span>
            </div>
          </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 bg-brand w-64 shadow-xl z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-white/10 hidden lg:flex flex-col items-center text-center">
            {/* Desktop Logo */}
            <div className="mb-3">
              <img src="logo.png" alt="Logo" className="h-12 object-contain mx-auto" onError={(e) => e.currentTarget.style.display = 'none'} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Nossa<span className="text-primary">Fintech</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">Gestão de Propostas</p>
          </div>

          <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
            <div className="lg:hidden p-4 mb-4 bg-white/5 rounded-lg border border-white/10">
               <p className="text-sm font-semibold text-white">{user?.name}</p>
               <p className="text-xs text-primary">{user?.role === 'MASTER' ? 'Administrador' : 'Vendedor'}</p>
            </div>

            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/propostas" icon={FileText} label="Propostas" />
            {user?.role === 'MASTER' && (
              <>
                <div className="my-4 border-t border-white/10 mx-2"></div>
                <NavItem to="/importar" icon={UploadCloud} label="Importar Dados" />
                <NavItem to="/usuarios" icon={Users} label="Usuários" />
              </>
            )}
          </div>

          <div className="p-4 border-t border-white/10 bg-black/20">
            <div className="hidden lg:block mb-4 px-2">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-primary font-medium">{user?.role === 'MASTER' ? 'Administrador' : 'Vendedor'}</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-2 w-full text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mb-2"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>

            <a
              href="https://github.com/TSantos-coder/NossaFintech"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-3 px-4 py-2 w-full text-gray-500 hover:text-white transition-colors text-xs border-t border-white/5 pt-3"
            >
              <Github size={16} />
              <span>Repositório Git</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden pt-16 lg:pt-0">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;