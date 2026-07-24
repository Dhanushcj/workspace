'use client';

import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Kanban, 
  ListTodo, 
  Settings, 
  Users, 
  ChevronRight,
  Plus,
  Briefcase
} from 'lucide-react';
import { cn } from '../../lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Kanban Board', href: '/board', icon: Kanban },
  { name: 'Backlog', href: '/backlog', icon: ListTodo },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Projects', href: '/projects', icon: Briefcase },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-white text-slate-600 border-r border-slate-200 flex flex-col fixed left-0 top-0 z-50 shadow-sm">
      <div className="p-6 flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
        <span className="font-black text-xl tracking-tighter text-slate-900 uppercase">Forge India</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative text-sm font-medium",
              pathname === item.href 
                ? "bg-blue-50 text-blue-600" 
                : "hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <item.icon className={cn(
              "w-5 h-5 transition-colors",
              pathname === item.href ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
            )} />
            <span>{item.name}</span>
            {pathname === item.href && (
              <div className="absolute right-3 w-1.5 h-1.5 bg-blue-600 rounded-full" />
            )}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-slate-900/10">
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>
    </aside>
  );
};

