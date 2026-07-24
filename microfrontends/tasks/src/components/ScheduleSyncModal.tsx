

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  X, Calendar, Clock, Users, 
  MessageSquare, Loader, CircleCheck,
  Video, Zap, ArrowRight
} from 'lucide-react';
import api from '../lib/api';
import { useNotificationStore } from '../store/notificationStore';

const syncSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  scheduledAt: z.string().min(1, 'Date and time are required'),
  durationMinutes: z.string().min(1, 'Please select duration'),
  notes: z.string().optional(),
  participantIds: z.array(z.string()).min(1, 'Select at least one participant')
});

type SyncFormData = z.infer<typeof syncSchema>;

interface ScheduleSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  sprintId: string | undefined;
  projectId: string | undefined;
  sprintName: string | undefined;
}

export const ScheduleSyncModal = ({ isOpen, onClose, sprintId, projectId, sprintName }: ScheduleSyncModalProps) => {
  const { addNotification } = useNotificationStore();
  const [members, setMembers] = useState<any[]>([]);
  const [upcomingSyncs, setUpcomingSyncs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<SyncFormData>({
    resolver: zodResolver(syncSchema),
    defaultValues: {
      title: `Sprint Sync — ${sprintName || 'Current Sprint'}`,
      durationMinutes: '30',
      participantIds: []
    }
  });

  const selectedParticipants = watch('participantIds');

  useEffect(() => {
    if (isOpen && projectId && sprintId) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [membersRes, syncsRes] = await Promise.all([
            api.get(`/auth/users`), // Fetching all users in org for now, can filter by project if membership route exists
            api.get(`/syncs?sprintId=${sprintId}&upcoming=true`)
          ]);
          setMembers(membersRes.data);
          setUpcomingSyncs(syncsRes.data);
        } catch (err) {
          console.error('Failed to fetch data', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
      reset({ title: `Sprint Sync — ${sprintName}`, durationMinutes: '30', participantIds: [] });
    }
  }, [isOpen, projectId, sprintId, sprintName, reset]);

  const onSubmit = async (data: SyncFormData) => {
    setIsSubmitting(true);
    try {
      await api.post('/syncs', {
        ...data,
        sprintId
      });

      addNotification({
        title: 'Meeting Scheduled',
        message: `Sync scheduled for ${new Date(data.scheduledAt).toLocaleString()}`,
        type: 'SUCCESS'
      });
      onClose();
    } catch (err: any) {
      addNotification({
        title: 'Scheduling Failed',
        message: err.response?.data?.message || 'Failed to schedule meeting',
        type: 'ERROR'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 lg:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100">
              <Video size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Schedule Team Sync</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sprintName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Upcoming Syncs Quick List */}
          {upcomingSyncs.length > 0 && (
            <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100/50">
               <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Zap size={12} fill="currentColor" /> Upcoming Sprint Meetings
               </h3>
               <div className="space-y-3">
                  {upcomingSyncs.map(sync => (
                    <div key={sync.id} className="bg-white p-4 rounded-2xl flex items-center justify-between border border-white shadow-sm">
                       <div>
                          <p className="text-xs font-black text-slate-900">{sync.title}</p>
                          <p className="text-[10px] font-bold text-slate-400">
                            {new Date(sync.scheduledAt).toLocaleDateString()} @ {new Date(sync.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                       </div>
                       <div className="flex -space-x-2">
                          {sync.participants.slice(0, 3).map((p: any) => (
                            <div key={p.id} className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500">
                               {p.user.name[0]}
                            </div>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6">
               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Meeting Title*</label>
                  <input 
                    {...register('title')}
                    placeholder="Sync Meeting Title"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  />
                  {errors.title && <p className="text-[10px] font-bold text-red-500 mt-2">{errors.title.message}</p>}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Date & Time*</label>
                    <div className="relative">
                       <Calendar size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                       <input 
                         type="datetime-local"
                         {...register('scheduledAt')}
                         className="w-full pl-10 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                       />
                    </div>
                    {errors.scheduledAt && <p className="text-[10px] font-bold text-red-500 mt-2">{errors.scheduledAt.message}</p>}
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Duration*</label>
                    <div className="relative">
                       <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                       <select 
                         {...register('durationMinutes')}
                         className="w-full pl-10 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none"
                       >
                          <option value="15">15 Minutes</option>
                          <option value="30">30 Minutes</option>
                          <option value="45">45 Minutes</option>
                          <option value="60">1 Hour</option>
                       </select>
                    </div>
                  </div>
               </div>

               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Notes / Agenda</label>
                  <textarea 
                    {...register('notes')}
                    rows={3}
                    placeholder="Topics for discussion..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                  />
               </div>

               <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Participants*</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                     {members.map(member => (
                       <label 
                         key={member.id} 
                         className={`
                           flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all
                           ${selectedParticipants.includes(member.id) 
                             ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                             : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
                           }
                         `}
                       >
                          <input 
                            type="checkbox"
                            className="hidden"
                            value={member.id}
                            checked={selectedParticipants.includes(member.id)}
                            onChange={(e) => {
                              const current = selectedParticipants;
                              if (e.target.checked) {
                                setValue('participantIds', [...current, member.id]);
                              } else {
                                setValue('participantIds', current.filter(id => id !== member.id));
                              }
                            }}
                          />
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black ${selectedParticipants.includes(member.id) ? 'bg-white/20' : 'bg-slate-100'}`}>
                             {member.name[0]}
                          </div>
                          <span className="text-[10px] font-black truncate">{member.name}</span>
                       </label>
                     ))}
                  </div>
                  {errors.participantIds && <p className="text-[10px] font-bold text-red-500 mt-2">{errors.participantIds.message}</p>}
               </div>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-5 bg-indigo-600 text-white rounded-3xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
               {isSubmitting ? <Loader className="animate-spin" size={20} /> : <Video size={20} />}
               Schedule Meeting
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

