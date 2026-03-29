import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
}

export const StatCard = ({ title, value, icon: Icon }: StatCardProps) => (
  <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg">
    <div className="flex items-center">
      <div className="p-3 bg-slate-700 rounded-full">
        <Icon className="w-5 h-5 text-yellow-400" />
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-slate-400">{title}</p>
        <p className="text-2xl font-bold text-yellow-400">{value}</p>
      </div>
    </div>
  </div>
);