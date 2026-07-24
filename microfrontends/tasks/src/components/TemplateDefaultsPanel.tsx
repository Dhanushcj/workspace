

import React from 'react';
import { Shield, Bell, Globe, Briefcase, ChevronRight, Zap } from 'lucide-react';
import { useNavigate as useRouter } from 'react-router-dom';

export default function TemplateDefaultsPanel({ projectTitle }: { projectTitle?: string }) {
  const router = useRouter();

  const defaults = [
    { 
      label: 'Default Workflow', 
      value: 'Agile', 
      icon: <Briefcase size={16} className="text-emerald-400" />,
      description: 'Automatic Kanban/Scrum hybrid setup.'
    },
    { 
      label: 'Notification', 
      value: 'Push Enabled', 
      icon: <Bell size={16} className="text-emerald-400" />,
      description: 'System-wide push alerts for milestone events.'
    },
    { 
      label: 'Visibility', 
      value: 'Organization', 
      icon: <Globe size={16} className="text-emerald-400" />,
      description: 'Accessible by all members within Nexus Enterprise.'
    },
  ];

  const navigateToSettings = () => {
    router('/dashboard/lead/settings?tab=project-defaults');
  };

  return (
    <div className="bg-[#3C3489] p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden group">
      {/* Decorative lightning bolt icon (top right) */}
      <div className="absolute top-0 right-0 p-8 opacity-10 transition-transform group-hover:scale-110 duration-500">
         <Zap size={120} fill="white" />
      </div>

      <h3 className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-8 flex items-center gap-2">
         <Shield size={14} /> Template Defaults: <span className="text-white">{projectTitle || 'Untitled'}</span>
      </h3>

      <div className="space-y-6 relative z-10">
         {defaults.map((item, index) => (
            <div 
              key={index}
              onClick={navigateToSettings}
              className="flex items-start gap-4 p-2 -m-2 rounded-2xl hover:bg-white/5 transition-all cursor-pointer group/item"
              title="Applied automatically to all new projects"
            >
               <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-1 shadow-inner border border-white/5">
                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                     <Shield size={12} className="text-white" />
                  </div>
               </div>
               <div className="flex-1">
                  <div className="flex items-center justify-between">
                     <p className="text-xs font-black uppercase tracking-widest mb-1 group-hover/item:text-emerald-400 transition-colors">
                        {item.label}: <span className="text-indigo-200">{item.value}</span>
                     </p>
                     <ChevronRight size={14} className="text-white/20 group-hover/item:text-white transition-colors" />
                  </div>
                  <p className="text-[10px] text-indigo-300 leading-relaxed font-medium">
                     {item.description}
                  </p>
               </div>
            </div>
         ))}
      </div>

      <div className="mt-10 pt-8 border-t border-white/10 flex items-center justify-between">
         <p className="text-[10px] font-bold text-indigo-400">Settings governed by Organization Policy</p>
         <button 
           onClick={navigateToSettings}
           className="text-[10px] font-black uppercase tracking-widest text-white hover:text-emerald-400 transition-colors underline underline-offset-4"
         >
            Edit Defaults
         </button>
      </div>
    </div>
  );
}

