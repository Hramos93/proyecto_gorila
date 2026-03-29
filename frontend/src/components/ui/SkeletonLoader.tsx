import React from 'react';

export const SkeletonLoader = ({ rows = 5 }: { rows?: number }) => (
  <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden animate-pulse">
    <div className="h-12 bg-zinc-900 border-b border-zinc-800" /> {/* Cabecera falsa */}
    <div className="divide-y divide-zinc-800/50">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-zinc-800 rounded" />
              <div className="h-3 w-20 bg-zinc-800 rounded opacity-50" />
            </div>
          </div>
          <div className="h-4 w-24 bg-zinc-800 rounded hidden md:block" />
          <div className="h-6 w-16 bg-zinc-800 rounded-full" />
        </div>
      ))}
    </div>
  </div>
);