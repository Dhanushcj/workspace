

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate as useRouter } from 'react-router-dom';
import { ArrowRight, Kanban, Activity, Shield, Zap, Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Home() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      const dashboardMap: any = {
        'DEVELOPER': '/dashboard/dev',
        'TEAM_LEAD': '/dashboard/lead',
        'TESTER': '/dashboard/test',
        'MANAGER': '/dashboard/manager'
      };
      router(dashboardMap[user.role] || '/dashboard/manager');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-white flex flex-col selection:bg-yellow-100 font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="h-24 px-10 flex items-center justify-between sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="flex items-center gap-4 group cursor-pointer">
          <img src="/logo.png" alt="Forge India Logo" className="h-14 w-auto object-contain transition-transform group-hover:scale-110 duration-500" />
          <div className="flex flex-col leading-none">
            <span className="text-[20px] font-black tracking-tighter text-[#0056B3] uppercase">Forge <span className="text-[#F7B500]">India</span></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">Connect Pvt Ltd</span>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-10">
          {['Solutions', 'Velocity', 'Analytics', 'Security'].map((item) => (
            <Link key={item} to={`#${item.toLowerCase()}`} className="text-[11px] font-black text-slate-500 hover:text-[#0056B3] uppercase tracking-[0.2em] transition-all">
              {item}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-[11px] font-black text-slate-900 uppercase tracking-widest px-6 py-3 hover:text-[#0056B3] transition-colors">
            Portal Access
          </Link>
          <Link to="/login" className="bg-[#0056B3] text-white px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#F7B500] transition-all shadow-xl shadow-blue-900/20 active:scale-95">
            Initialize
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 relative">
        <section className="relative px-6 pt-32 pb-40 text-center overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none -z-10">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] bg-[#0056B3]/5 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[0%] right-[-10%] w-[40%] h-[60%] bg-[#F7B500]/5 blur-[120px] rounded-full" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
          </div>

          <div className="max-w-6xl mx-auto flex flex-col items-center">
            <div className="inline-flex items-center gap-3 bg-blue-50 text-[#0056B3] px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] mb-12 border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top-8 duration-1000">
              <span className="w-2 h-2 bg-[#F7B500] rounded-full animate-pulse" />
              Intelligence Driven Project Management
            </div>

            <h1 className="text-7xl md:text-[110px] font-black text-slate-900 tracking-tighter leading-[0.85] mb-12 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
              Forging the <br />
              <span className="text-[#0056B3]">Future</span> of <span className="text-[#F7B500]">Velocity.</span>
            </h1>

            <p className="text-xl text-slate-500 max-w-3xl mb-16 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
              Operational excellence redefined. Forge India Connect provides the high-octane infrastructure needed for mission-critical project execution and real-time division synchronization.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700">
              <Link 
                to="/login" 
                className="group flex items-center gap-4 bg-[#0056B3] text-white px-12 py-6 rounded-[28px] text-xs font-black uppercase tracking-[0.2em] hover:bg-[#F7B500] transition-all shadow-2xl shadow-blue-900/30 hover:scale-105 active:scale-95"
              >
                Launch Application
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="flex items-center gap-4 bg-white text-slate-900 border border-slate-200 px-12 py-6 rounded-[28px] text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm">
                <Shield className="w-5 h-5 text-[#F7B500]" />
                Security Whitepaper
              </button>
            </div>
          </div>
        </section>

        {/* Feature Experience */}
        <section id="solutions" className="py-32 bg-slate-50">
          <div className="max-w-7xl mx-auto px-10">
            <div className="flex flex-col lg:flex-row items-end justify-between mb-24 gap-10">
              <div className="max-w-2xl">
                <h2 className="text-[10px] font-black text-[#0056B3] uppercase tracking-[0.4em] mb-6">Production Architecture</h2>
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">
                  High-Density tools for <br />
                  <span className="text-slate-400">High-Performance teams.</span>
                </h3>
              </div>
              <p className="text-slate-500 font-medium max-w-md pb-2 italic text-lg border-l-4 border-[#F7B500] pl-6">
                "We don't just manage projects; we forge them into reality with industrial precision."
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { icon: Kanban, title: 'Sprint Board v4', desc: 'Real-time drag-and-drop interfaces with millisecond synchronization across global units.', accent: '#0056B3' },
                { icon: Activity, title: 'Velocity Engine', desc: 'Predictive analytics that map your team\'s throughput against mission-critical deadlines.', accent: '#F7B500' },
                { icon: Shield, title: 'Secure Protocol', desc: 'Enterprise-grade security ensuring your intellectual property stays within the Forge.', accent: '#0056B3' },
              ].map((feature, i) => (
                <div key={i} className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-xl shadow-slate-200/40 hover:scale-[1.02] transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity translate-x-8 translate-y-[-8px]">
                    <feature.icon size={120} />
                  </div>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-10 shadow-lg" style={{ backgroundColor: feature.accent }}>
                    <feature.icon size={28} />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 mb-4">{feature.title}</h4>
                  <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Brand Momentum */}
        <section className="py-40 bg-[#0056B3] text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/asfalt-dark.png')]" />
          <div className="max-w-6xl mx-auto px-10 text-center relative z-10">
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter mb-12">
              Ready to <span className="text-[#F7B500]">accelerate?</span>
            </h2>
            <Link 
              to="/login" 
              className="inline-flex items-center gap-4 bg-[#F7B500] text-[#0056B3] px-16 py-8 rounded-[32px] text-sm font-black uppercase tracking-[0.3em] hover:bg-white transition-all shadow-3xl hover:scale-105 active:scale-95"
            >
              Get Started with Forge India
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white py-24 px-10 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-20">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto grayscale opacity-50" />
              <span className="font-black text-slate-900 uppercase tracking-tighter text-xl">Forge India <span className="text-[#0056B3]">Connect</span></span>
            </div>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] max-w-xs leading-loose">
              Powering the next generation of industrial-grade project management technologies.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-20">
            {['Product', 'Company', 'Legal'].map(cat => (
              <div key={cat} className="space-y-6">
                <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">{cat}</h5>
                <ul className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <li key={i} className="text-[10px] font-black text-slate-400 hover:text-[#0056B3] uppercase tracking-widest cursor-pointer transition-colors">Link {i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-slate-300 text-[9px] font-black uppercase tracking-[0.5em]">© 2026 FORGE INDIA CONNECT PVT. LTD.</p>
          <div className="flex gap-10">
            {['Terms', 'Privacy', 'Security'].map(item => (
              <span key={item} className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] hover:text-[#F7B500] cursor-pointer transition-colors">{item}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

