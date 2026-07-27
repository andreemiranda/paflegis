import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 space-y-3.5 animate-pulse">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="h-5 bg-slate-200 rounded w-28"></div>
        <div className="h-5 bg-slate-200 rounded-full w-20"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-slate-200 rounded w-full"></div>
        <div className="h-4 bg-slate-200 rounded w-5/6"></div>
      </div>
      <div className="flex items-center gap-4 pt-1">
        <div className="h-3 bg-slate-200 rounded w-32"></div>
        <div className="h-3 bg-slate-200 rounded w-24"></div>
      </div>
      <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
        <div className="h-9 bg-slate-200 rounded-xl w-32"></div>
        <div className="h-9 bg-slate-200 rounded-xl w-32"></div>
      </div>
    </div>
  );
};

export const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};
