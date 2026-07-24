'use client';

import React, { useState } from 'react';
import { 
  Search, Plus, Hash, Settings, 
  Phone, Video, Info, MoreVertical,
  Smile, Paperclip, Send, Zap,
  GitPullRequest, AlertCircle, FileText,
  Clock, CircleCheck, ChevronRight, User,
  Globe, Lock, Users, MessageSquare, Flag, 
  Layout, Archive, Download, Pin,
  AtSign, Command, Image, Mic, Share2, 
  ArrowUpRight, ExternalLink, ChevronDown
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

export const MessagesView = () => {
  const [selectedChat, setSelectedChat] = useState('# api-gateway');

  const { currentSprint } = useWorkflowStore();

  const pinned: any[] = [];
  const channels: any[] = [];
  const dms: any[] = [];
  const threads: any[] = [];

  return (
    <div className="flex h-full bg-white overflow-hidden font-sans">
      {/* ─── Sidebar ────────────────────────────────────────────────────────── */}
      <div className="w-[320px] border-r border-slate-200 flex flex-col bg-white">
        {/* Sidebar Header */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Messages</h2>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
              <Plus size={16} /> New
            </button>
          </div>

          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400">
               <Search size={16} />
            </div>
            <input 
              type="text" 
              placeholder="Search messages..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-[14px] font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Sidebar Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-10 space-y-8">
          {/* Pinned */}
          <div className="space-y-3">
             <h3 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pinned</h3>
             {pinned.map(item => (
               <ChatItem key={item.id} name={item.name} icon={item.icon} unread={item.unread} meta={item.meta} />
             ))}
          </div>

          {/* Channels */}
          <div className="space-y-3">
             <h3 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Channels</h3>
             {channels.map(item => (
               <ChatItem 
                key={item.id} 
                name={item.name} 
                unread={item.unread} 
                meta={item.meta} 
                time={item.time} 
                active={selectedChat === item.name}
                onClick={() => setSelectedChat(item.name)}
                icon={<div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600"><Hash size={14} /></div>}
               />
             ))}
          </div>

          {/* Direct Messages */}
          <div className="space-y-3">
             <h3 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Direct Messages</h3>
             {dms.map(item => (
               <ChatItem 
                key={item.id} 
                name={item.name} 
                meta={item.meta} 
                time={item.time} 
                online={item.online}
                initials={item.initials}
                color={item.color}
               />
             ))}
          </div>

          {/* Group Threads */}
          <div className="space-y-3">
             <h3 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Group Threads</h3>
             {threads.map(item => (
               <ChatItem 
                key={item.id} 
                name={item.name} 
                unread={item.unread} 
                meta={item.meta} 
                time={item.time} 
                initials={item.initials}
                initials2={item.initials2}
               />
             ))}
          </div>
        </div>
      </div>

      {/* ─── Main Chat Area ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Chat Header */}
        <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border-2 border-white flex items-center justify-center text-rose-600 text-[12px] font-black shadow-sm">DV</div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 border-2 border-white flex items-center justify-center text-blue-600 text-[12px] font-black shadow-sm"><Hash size={14} /></div>
             </div>
             <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  {selectedChat}
                </h3>
                <p className="text-[11px] text-slate-400 font-bold">
                   3 members · Dev Vikram is online
                </p>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <HeaderAction icon={<Phone size={18} />} />
             <HeaderAction icon={<Video size={18} />} />
             <HeaderAction icon={<Search size={18} />} />
             <HeaderAction icon={<AtSign size={18} />} />
             <HeaderAction icon={<Info size={18} />} />
          </div>
        </div>

        {/* Linked Project Banner */}
        <div className="px-8 py-3 bg-emerald-50/50 border-b border-emerald-100 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                <Layout size={16} />
              </div>
              <p className="text-[12px] font-bold text-slate-700">
                This channel will be linked to your active projects
              </p>
           </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-[#FDFBF7]/30 flex flex-col items-center justify-center">
           <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
             <MessageSquare size={24} />
           </div>
           <p className="text-slate-500 font-medium">No messages yet</p>
           <p className="text-sm text-slate-400">Start a conversation to get started.</p>
        </div>

        {/* Message Input Area */}
        <div className="px-8 py-6 border-t border-slate-100 space-y-4 bg-white shrink-0">
          <div className="flex items-center gap-2">
             <InputAction icon={<Command size={18} />} />
             <InputAction icon={<Paperclip size={18} />} />
             <InputAction icon={<Image size={18} />} />
             <div className="w-px h-4 bg-slate-200 mx-1" />
             <InputAction icon={<Mic size={18} />} />
             <InputAction icon={<Video size={18} />} />
             <div className="w-px h-4 bg-slate-200 mx-1" />
             <InputAction icon={<Zap size={18} />} />
             <InputAction icon={<Share2 size={18} />} />
          </div>

          <div className="flex items-center gap-4">
             <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder={`Message ${selectedChat} — type @ to mention someone`} 
                  className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-[15px] font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-sm"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400">
                   <Smile size={20} className="cursor-pointer hover:text-slate-900" />
                </div>
             </div>
             <button className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95">
                <Send size={24} />
             </button>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
             <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-1" />
             Tip: Link a task with <span className="text-slate-600">/task</span> or share a file with <span className="text-slate-600">/file</span>
          </div>
        </div>
      </div>
    </div>
  );
};

function ChatItem({ name, unread, meta, time, active, online, initials, initials2, color, icon, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`px-3 py-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all border border-transparent ${
        active ? 'bg-indigo-50/50 border-indigo-100 shadow-sm' : 'hover:bg-slate-50'
      }`}
    >
      <div className="relative shrink-0">
        {icon ? icon : (
          <div className="flex -space-x-1.5">
            <div className={`w-10 h-10 rounded-xl ${color || 'bg-slate-100'} border-2 border-white flex items-center justify-center text-[11px] font-black ${color ? 'text-white' : 'text-slate-500'}`}>
              {initials}
            </div>
            {initials2 && (
              <div className="w-10 h-10 rounded-xl bg-slate-50 border-2 border-white flex items-center justify-center text-slate-400 text-[11px] font-black">
                {initials2}
              </div>
            )}
          </div>
        )}
        {online && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <h4 className="text-[13px] font-black text-slate-900 truncate">{name}</h4>
          {time && <span className="text-[10px] font-bold text-slate-400">{time}</span>}
        </div>
        <div className="flex justify-between items-center gap-2">
          <p className="text-[11px] text-slate-500 font-bold truncate">{meta}</p>
          {unread > 0 && (
            <div className="w-5 h-5 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shrink-0 shadow-sm">
              {unread}
            </div>
          )}
          {active && !unread && online && (
            <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}

function HeaderAction({ icon }: any) {
  return (
    <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200">
      {icon}
    </button>
  );
}

function InputAction({ icon }: any) {
  return (
    <button className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-slate-100 shadow-sm">
      {icon}
    </button>
  );
}

function Message({ initials, color, name, time, content, reactions }: any) {
  return (
    <div className="flex items-start gap-4 group">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-[12px] font-black shadow-sm shrink-0`}>
        {initials}
      </div>
      <div className="space-y-2 max-w-[80%]">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-black text-slate-900">{name}</span>
          <span className="text-[10px] font-bold text-slate-400">{time}</span>
        </div>
        <div className="bg-white border border-slate-100 p-6 rounded-[32px] rounded-tl-none shadow-sm hover:shadow-md transition-all group-hover:border-slate-200">
           <div className="text-[15px] font-bold text-slate-700 leading-relaxed">
             {content}
           </div>
        </div>
        {reactions && (
          <div className="flex items-center gap-2 mt-2">
            {reactions.map((r: any, i: number) => (
              <button key={i} className="px-2 py-1 bg-white border border-slate-100 rounded-lg flex items-center gap-1.5 shadow-sm hover:border-indigo-200 transition-all">
                <span className="text-[12px]">{r.emoji}</span>
                <span className="text-[10px] font-black text-slate-500">{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

