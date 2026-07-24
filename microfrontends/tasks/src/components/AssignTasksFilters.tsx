

import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Filter, User, Flag, CircleCheck } from 'lucide-react';

interface Developer {
  id: string;
  name: string;
}

interface FilterState {
  search: string;
  status: string;
  priority: string;
  developer: string;
  unassignedOnly: boolean;
}

interface Props {
  developers: Developer[];
  onFilterChange: (filters: FilterState) => void;
  totalCount: number;
  filteredCount: number;
}

export const AssignTasksFilters = ({ developers, onFilterChange, totalCount, filteredCount }: Props) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: 'all',
    priority: 'all',
    developer: 'all',
    unassignedOnly: false
  });

  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: debouncedSearch }));
    }, 200);
    return () => clearTimeout(timer);
  }, [debouncedSearch]);

  useEffect(() => {
    onFilterChange(filters);
  }, [filters, onFilterChange]);

  const isFilterActive = useMemo(() => {
    return filters.search !== '' || 
           filters.status !== 'all' || 
           filters.priority !== 'all' || 
           filters.developer !== 'all' || 
           filters.unassignedOnly;
  }, [filters]);

  const clearFilters = () => {
    setDebouncedSearch('');
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      developer: 'all',
      unassignedOnly: false
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 bg-white p-3 rounded-[32px] border border-slate-100 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text"
            placeholder="Search tasks..."
            value={debouncedSearch}
            onChange={(e) => setDebouncedSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-50 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="relative min-w-[160px]">
          <Filter size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
          <select 
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10"
          >
            <option value="all">All Statuses</option>
            <option value="TO_DO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="BLOCKED">Blocked</option>
            <option value="PR_SUBMITTED">PR Submitted</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div className="relative min-w-[160px]">
          <Flag size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
          <select 
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10"
          >
            <option value="all">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {/* Developer Filter */}
        <div className="relative min-w-[180px]">
          <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
          <select 
            value={filters.developer}
            onChange={(e) => setFilters(prev => ({ ...prev, developer: e.target.value }))}
            className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-500/10"
          >
            <option value="all">All Developers</option>
            <option value="unassigned">Unassigned</option>
            {developers.map(dev => (
              <option key={dev.id} value={dev.id}>{dev.name}</option>
            ))}
          </select>
        </div>

        {/* Unassigned Only Toggle */}
        <button 
          onClick={() => setFilters(prev => ({ ...prev, unassignedOnly: !prev.unassignedOnly }))}
          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${
            filters.unassignedOnly 
              ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-200' 
              : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
          }`}
        >
          {filters.unassignedOnly && <CircleCheck size={12} />}
          Unassigned Only
        </button>

        {/* Clear Filters */}
        {isFilterActive && (
          <button 
            onClick={clearFilters}
            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
            title="Clear all filters"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="px-4 flex items-center justify-between">
        <p className="text-[12px] font-medium text-slate-400 italic">
          Showing <span className="text-slate-900 font-black not-italic">{filteredCount}</span> of <span className="text-slate-900 font-black not-italic">{totalCount}</span> tasks
        </p>
      </div>
    </div>
  );
};

