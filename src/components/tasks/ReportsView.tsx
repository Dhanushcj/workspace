'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Users, Target, 
  ChevronRight, BarChart3, PieChart, 
  Calendar, Search, Filter, Loader,
  TrendingUp, CircleCheck, AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import api from '../../lib/api';
import { useWorkflowStore } from '../../store/workflowStore';

export default function ReportsView() {
  const { currentProject } = useWorkflowStore();
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<'employee' | 'project' | 'audit'>('project');
  const [timeRange, setTimeRange] = useState('This Sprint');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchReportData();
  }, [currentProject?.id, reportType]);

  const fetchReportData = async () => {
    if (!currentProject) return;
    setLoading(true);
    try {
      // Simulate fetching comprehensive report data
      // In a real app, this would be a specialized backend endpoint
      const [tasksRes, membersRes] = await Promise.all([
        api.get(`/issues?projectId=${currentProject.id}`),
        api.get('/users')
      ]);

      const tasksData = Array.isArray(tasksRes.data) ? tasksRes.data : (tasksRes.data?.data || []);
      const membersData = Array.isArray(membersRes.data) ? membersRes.data : (membersRes.data?.data || []);

      const tasks = tasksData.map((t: any) => ({ ...t, id: t.id || t._id, _id: t._id || t.id }));
      const members = membersData.map((m: any) => ({ ...m, id: m.id || m._id, _id: m._id || m.id }));

      // Process Project Data
      const projectStats = {
        totalTasks: tasks.length,
        completed: tasks.filter((t: any) => t.status === 'DONE').length,
        inProgress: tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
        backlog: tasks.filter((t: any) => t.status === 'TO_DO').length,
        blocked: tasks.filter((t: any) => t.status === 'BLOCKED').length,
        priorityBreakdown: [
          { name: 'Critical', value: tasks.filter((t: any) => t.priority === 'CRITICAL').length, color: '#EF4444' },
          { name: 'High', value: tasks.filter((t: any) => t.priority === 'HIGH').length, color: '#F97316' },
          { name: 'Medium', value: tasks.filter((t: any) => t.priority === 'MEDIUM').length, color: '#3B82F6' },
          { name: 'Low', value: tasks.filter((t: any) => t.priority === 'LOW').length, color: '#94A3B8' },
        ],
        velocityData: [
          { day: 'Mon', completed: 4 },
          { day: 'Tue', completed: 7 },
          { day: 'Wed', completed: 5 },
          { day: 'Thu', completed: 9 },
          { day: 'Fri', completed: 6 },
          { day: 'Sat', completed: 2 },
          { day: 'Sun', completed: 3 },
        ]
      };

      // Process Employee Data
      const employeeStats = members
        .filter((m: any) => m.role !== 'MANAGER')
        .map((m: any) => {
          const userTasks = tasks.filter((t: any) => t.assigneeId === m.id);
          return {
            id: m.id,
            name: m.name,
            role: m.role,
            assigned: userTasks.length,
            completed: userTasks.filter((t: any) => t.status === 'DONE').length,
            efficiency: userTasks.length > 0 
              ? Math.round((userTasks.filter((t: any) => t.status === 'DONE').length / userTasks.length) * 100) 
              : 0
          };
        });

      // Process Audit Data (Raw tasks for export)
      const auditData = tasks.map((t: any) => ({
        employee: t.assignee?.name || 'Unassigned',
        project: t.project?.name || currentProject?.name || 'Unknown',
        task: t.title,
        assignedDate: new Date(t.createdAt).toLocaleDateString(),
        dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A',
        completedDate: t.status === 'DONE' ? new Date(t.updatedAt).toLocaleDateString() : 'Pending'
      }));

      setStats({ project: projectStats, employees: employeeStats, audit: auditData });
    } catch (err) {
      console.error('Failed to fetch report data', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadXLS = () => {
    if (!stats) return;

    let content = '';
    const filename = `${currentProject?.name || 'Project'}_Report_${new Date().toISOString().split('T')[0]}.csv`;

    if (reportType === 'project') {
      content = "Metric,Value\n";
      content += `Total Tasks,${stats.project.totalTasks}\n`;
      content += `Completed,${stats.project.completed}\n`;
      content += `In Progress,${stats.project.inProgress}\n`;
      content += `Backlog,${stats.project.backlog}\n`;
      content += `Blocked,${stats.project.blocked}\n\n`;
      content += "Priority,Count\n";
      stats.project.priorityBreakdown.forEach((p: any) => {
        content += `${p.name},${p.value}\n`;
      });
    } else if (reportType === 'employee') {
      content = "Employee Name,Role,Tasks Assigned,Tasks Completed,Efficiency (%)\n";
      stats.employees.forEach((e: any) => {
        content += `${e.name},${e.role},${e.assigned},${e.completed},${e.efficiency}\n`;
      });
    } else if (reportType === 'audit') {
      content = "Employee Name,Project Name,Tasks,Assigned Date,Due Date,Completed Date\n";
      stats.audit.forEach((a: any) => {
        content += `"${a.employee}","${a.project}","${a.task}","${a.assignedDate}","${a.dueDate}","${a.completedDate}"\n`;
      });
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-blue-600" size={32} />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generating Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] overflow-y-auto custom-scrollbar p-8">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        
        {/* HEADER AREA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Intelligence Reports</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">Cross-functional performance audit for {currentProject?.name}</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                <button 
                  onClick={() => setReportType('project')}
                  className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${reportType === 'project' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  Project Audit
                </button>
                <button 
                  onClick={() => setReportType('employee')}
                  className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${reportType === 'employee' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  Employee Meta
                </button>
                <button 
                  onClick={() => setReportType('audit')}
                  className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${reportType === 'audit' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-900'}`}
                >
                  Operational Audit
                </button>
             </div>

             <button 
               onClick={downloadXLS}
               className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 hover:-translate-y-0.5 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
             >
               <FileSpreadsheet size={16} /> Export XLS
             </button>
          </div>
        </div>

        {reportType === 'project' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* SUMMARY CARDS */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-6">
               {[
                 { label: 'Total Output', value: stats.project.totalTasks, icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
                 { label: 'Completion', value: `${Math.round((stats.project.completed / (stats.project.totalTasks || 1)) * 100)}%`, icon: CircleCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                 { label: 'Active Friction', value: stats.project.blocked, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
                 { label: 'Efficiency', value: 'High', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
               ].map((c, i) => (
                 <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.color} flex items-center justify-center mb-6`}>
                       <c.icon size={20} />
                    </div>
                    <div>
                       <p className="text-3xl font-black text-slate-900 leading-none tracking-tighter">{c.value}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3">{c.label}</p>
                    </div>
                 </div>
               ))}
            </div>

            {/* PRIORITY BREAKDOWN */}
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                 <PieChart size={14} className="text-blue-600" /> Priority Allocation
               </h3>
               <div className="space-y-6">
                  {stats.project.priorityBreakdown.map((p: any) => (
                    <div key={p.name}>
                       <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">{p.name}</span>
                          <span className="text-[11px] font-black text-slate-900">{p.value} Tasks</span>
                       </div>
                       <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-1000" 
                            style={{ width: `${(p.value / (stats.project.totalTasks || 1)) * 100}%`, backgroundColor: p.color }} 
                          />
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* VELOCITY CHART */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
               <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-2">
                 <BarChart3 size={14} className="text-blue-600" /> Velocity Pulse
               </h3>
               <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.project.velocityData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                        dy={10}
                      />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{ fill: '#F8FAFC' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                      />
                      <Bar dataKey="completed" radius={[6, 6, 0, 0]}>
                        {stats.project.velocityData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={index === 3 ? '#3B82F6' : '#E2E8F0'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>
        ) : reportType === 'employee' ? (
          /* EMPLOYEE REPORTS */
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Employee</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Role</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Load</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Meta Efficiency</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-right">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {stats.employees.map((e: any) => (
                     <tr key={e.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs uppercase shadow-lg shadow-slate-900/10 group-hover:scale-105 transition-transform">
                                 {e.name[0]}
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{e.name}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Verified Operative</p>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                              {e.role}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-baseline gap-1">
                              <span className="text-sm font-black text-slate-900">{e.assigned}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Tasks</span>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="flex items-center gap-4 max-w-[200px]">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                 <div 
                                   className={`h-full rounded-full transition-all duration-1000 ${e.efficiency > 80 ? 'bg-emerald-500' : e.efficiency > 50 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                   style={{ width: `${e.efficiency}%` }} 
                                 />
                              </div>
                              <span className="text-[11px] font-black text-slate-900">{e.efficiency}%</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                              <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                              Active
                           </div>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        ) : (
          /* AUDIT REPORT PREVIEW */
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                   <FileText size={14} className="text-blue-600" /> Operational Data Stream
                </h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stats.audit.length} Entries Detected</span>
             </div>
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-slate-50/50">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Employee</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Project</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Task</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Assigned</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">Due Date</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 text-right">Completion</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {stats.audit.slice(0, 15).map((a: any, i: number) => (
                     <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6">
                           <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{a.employee}</p>
                        </td>
                        <td className="px-8 py-6">
                           <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                              {a.project}
                           </span>
                        </td>
                        <td className="px-8 py-6">
                           <p className="text-xs font-medium text-slate-600 line-clamp-1">{a.task}</p>
                        </td>
                        <td className="px-8 py-6">
                           <span className="text-[11px] font-bold text-slate-400">{a.assignedDate}</span>
                        </td>
                        <td className="px-8 py-6">
                           <span className={`text-[11px] font-bold ${a.dueDate === 'N/A' ? 'text-slate-300' : 'text-slate-600'}`}>{a.dueDate}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <span className={`text-[10px] font-black uppercase tracking-widest ${a.completedDate === 'Pending' ? 'text-amber-500' : 'text-emerald-500'}`}>
                              {a.completedDate}
                           </span>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
             {stats.audit.length > 15 && (
               <div className="p-6 bg-slate-50/50 text-center border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Showing first 15 entries. Export to XLS for full dataset.</p>
               </div>
             )}
          </div>
        )}

      </div>
    </div>
  );
}

