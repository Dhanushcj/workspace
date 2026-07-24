'use client';

import React, { useEffect, useState } from 'react';
import { useNavigate as useRouter } from 'react-router-dom';

interface Props {
  projectId: string;
  onPlanSprint?: () => void;
}

const SprintBoardEmptyState: React.FC<Props> = ({ projectId, onPlanSprint }) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    if (onPlanSprint) {
      onPlanSprint();
    } else {
      router(`/dashboard/lead/plan-sprints?projectId=${projectId}`);
    }
  };

  return (
    <div 
      className={`
        flex flex-col items-center justify-center bg-white 
        rounded-[24px] border-[0.5px] border-slate-200 
        px-10 py-12 w-full max-w-[440px] shadow-sm
        transition-all duration-300 ease-out
        ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      {/* Custom Inline SVG Icon */}
      <div className="flex items-center justify-center w-[48px] h-[40px]">
        <svg 
          width="48" 
          height="40" 
          viewBox="0 0 48 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="0" y="12" width="8" height="28" rx="4" fill="#B4B2A9" />
          <rect x="20" y="0" width="8" height="40" rx="4" fill="#B4B2A9" />
          <rect x="40" y="8" width="8" height="32" rx="4" fill="#B4B2A9" />
        </svg>
      </div>

      <h2 className="text-[24px] font-medium text-slate-900 mt-6 tracking-tight">
        No active sprint.
      </h2>

      <p className="text-[15px] font-normal text-slate-500 mt-3 text-center max-w-[320px] leading-relaxed">
        Initialize your first sprint to start tracking velocity and team progress.
      </p>

      <button
        onClick={handleClick}
        className="
          mt-[28px] h-[52px] w-full max-w-[320px] 
          bg-[#534AB7] text-white rounded-[32px] 
          text-[14px] font-medium uppercase tracking-[0.04em]
          hover:bg-[#3C3489] active:scale-[0.98]
          transition-all duration-200 shadow-lg shadow-[#534AB7]/20
          flex items-center justify-center gap-2
        "
      >
        PLAN YOUR FIRST SPRINT
      </button>
    </div>
  );
};

export default SprintBoardEmptyState;

