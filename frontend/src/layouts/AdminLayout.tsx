import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, BarChart3, AlertTriangle,
  Activity, ClipboardList, LogOut, Cpu
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/requests', icon: FileText, label: 'All Requests' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/bottlenecks', icon: AlertTriangle, label: 'Bottlenecks' },
  { to: '/admin/sla', icon: Activity, label: 'SLA Monitoring' },
  { to: '/admin/audit', icon: ClipboardList, label: 'Audit History' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <aside className="w-64 flex-shrink-0 gradient-navy flex flex-col shadow-sidebar">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-sm leading-none">CampusFlow AI</h1>
              <p className="text-slate-400 text-[10px] mt-0.5">Admin Console</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}>
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs text-white font-bold">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user?.name}</p>
              <p className="text-slate-400 text-[10px]">Administrator</p>
            </div>
          </div>
          <button onClick={() => { logout(); navigate('/login'); }} className="sidebar-item w-full">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
