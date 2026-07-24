import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export interface BlockerCardProps {
  blocker: {
    id: string;
    task: { id: string; title: string; priority?: string };
    reporter: { id: string; name: string };
    description: string;
    created_at: string;
    status: 'open' | 'resolved';
  };
  onResolveClick: (blockerId: string) => void;
  isResolving?: boolean;
}

export default function BlockerCard({ blocker, onResolveClick, isResolving = false }: BlockerCardProps) {
  const [showFullDesc, setShowFullDesc] = useState(false);

  // Normalize priority to lowercase
  const priorityKey = (blocker.task.priority?.toLowerCase() || 'medium') as 'critical' | 'high' | 'medium' | 'low';
  
  const priorityConfig: Record<string, { borderColor: string; badgeBg: string; badgeText: string; label: string }> = {
    critical: { borderColor: '#E24B4A', badgeBg: '#FCEBEB', badgeText: '#791F1F', label: 'Critical' },
    high:     { borderColor: '#EF9F27', badgeBg: '#FAEEDA', badgeText: '#633806', label: 'High' },
    medium:   { borderColor: '#378ADD', badgeBg: '#E6F1FB', badgeText: '#0C447C', label: 'Medium' },
    low:      { borderColor: '#888780', badgeBg: '#F1EFE8', badgeText: '#444441', label: 'Low' }
  };
  
  const config = priorityConfig[priorityKey] || priorityConfig.medium;

  const getTimeAgo = (dateString: string) => {
    try {
      const now = new Date();
      const past = new Date(dateString);
      const diffHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 24) {
        return { text: `${Math.max(0, diffHours)} hr${diffHours !== 1 ? 's' : ''} ago`, isUrgent: false };
      } else {
        const diffDays = Math.floor(diffHours / 24);
        return { text: `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`, isUrgent: true };
      }
    } catch {
      return { text: 'Unknown time', isUrgent: false };
    }
  };

  const timeAgo = getTimeAgo(blocker.created_at);

  const reporterInitials = blocker.reporter?.name 
    ? blocker.reporter.name.substring(0, 2).toUpperCase() 
    : '??';

  return (
    <div 
      className="bg-white"
      style={{
        borderRadius: '0 12px 12px 0',
        border: '0.5px solid var(--color-border-secondary, #e2e8f0)',
        borderLeftWidth: '4px',
        borderLeftStyle: 'solid',
        borderLeftColor: config.borderColor,
        padding: '16px',
        marginBottom: '12px'
      }}
    >
      {/* ROW 1 — Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <span 
            className="px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: config.badgeBg, color: config.badgeText }}
          >
            {config.label}
          </span>
          <span className="font-bold text-[14px] text-slate-900">{blocker.task.title}</span>
        </div>
        <span 
          className="text-xs font-medium whitespace-nowrap ml-4" 
          style={{ color: timeAgo.isUrgent ? '#E24B4A' : '#64748b' }}
        >
          {timeAgo.text}
        </span>
      </div>

      {/* ROW 2 — Reporter */}
      <div className="flex items-center gap-2 mb-3">
        <div 
          className="flex items-center justify-center rounded-full text-xs font-bold"
          style={{ width: '28px', height: '28px', backgroundColor: '#FAEEDA', color: '#633806' }}
        >
          {reporterInitials}
        </div>
        <span className="text-[13px] text-slate-500">
          Blocked by {blocker.reporter?.name || 'Unknown User'}
        </span>
      </div>

      {/* ROW 3 — Description */}
      <div className="mb-4">
        <div 
          className="text-[14px] leading-relaxed prose prose-slate max-w-none"
          style={{ color: 'var(--color-text-secondary, #475569)' }}
          dangerouslySetInnerHTML={{ __html: showFullDesc 
            ? blocker.description 
            : (blocker.description?.length > 150 ? `${blocker.description.substring(0, 150)}...` : blocker.description)
          }}
        />
        {blocker.description?.length > 150 && (
          <button 
            onClick={() => setShowFullDesc(!showFullDesc)}
            className="text-xs text-blue-600 mt-1 hover:underline focus:outline-none"
          >
            {showFullDesc ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {/* ROW 4 & 5 — Task link and Action */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1">
        <Link 
          href={`/dashboard/lead?taskId=${blocker.task.id}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors flex items-center"
        >
          <span className="mr-1">&rarr;</span> View task: {blocker.task.title}
        </Link>
        <button
          onClick={() => onResolveClick(blocker.id)}
          disabled={isResolving}
          className="text-sm font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          style={{
            backgroundColor: isResolving ? '#a5a0d6' : '#534AB7',
            color: 'white',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: isResolving ? 'not-allowed' : 'pointer'
          }}
        >
          {isResolving ? 'Resolving...' : 'RESOLVE BLOCKER'}
        </button>
      </div>
    </div>
  );
}

export function EmptyBlockerState() {
  return (
    <div className="flex flex-col items-center justify-center w-full py-20">
      <svg 
        width="48" height="48" viewBox="0 0 48 48" fill="none" 
        stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="M44 24C44 35.0457 35.0457 44 24 44C12.9543 44 4 35.0457 4 24C4 12.9543 12.9543 4 24 4C35.0457 4 44 12.9543 44 24Z" />
        <path d="M14 24L20 30L34 16" />
      </svg>
      <p 
        className="mt-4 font-bold"
        style={{ 
          fontSize: '12px', 
          textTransform: 'uppercase', 
          letterSpacing: '0.08em', 
          color: '#94a3b8' 
        }}
      >
        TEAM IS FLOWING SMOOTHLY
      </p>
    </div>
  );
}

