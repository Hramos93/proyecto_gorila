import React from 'react';

interface BadgeProps {
  status: 'PAID' | 'PENDING' | 'OVERDUE';
}

export const Badge = ({ status }: BadgeProps) => {
  const statusConfig = {
    PAID: { styles: 'bg-green-500/10 text-green-400 border-green-500/20', text: 'Al día' },
    PENDING: { styles: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', text: 'Pendiente' },
    OVERDUE: { styles: 'bg-red-500/10 text-red-400 border-red-500/20', text: 'Vencido' },
  };
  const { styles, text } = statusConfig[status] || statusConfig.PENDING;
  return (
    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full border ${styles}`}>
      {text}
    </span>
  );
};