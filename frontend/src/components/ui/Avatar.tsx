import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  url?: string | null;
  name?: string;
}

export const Avatar = ({ url, name }: AvatarProps) => {
  return url ? (
    <img className="h-10 w-10 rounded-full object-cover border border-zinc-700" src={url} alt={name} />
  ) : (
    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
      <User className="h-6 w-6 text-zinc-500" />
    </div>
  );
};