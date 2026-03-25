import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Link, Loader2, Search, UserCheck } from 'lucide-react';
import { apiClient, isAxiosError } from '../../../api/client';
import type { MatchedUser, User } from '../types';

// Simple debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}


interface UnmatchedRowProps {
  text: string;
  onUserResolved: (user: MatchedUser) => void;
}

export const UnmatchedRow: React.FC<UnmatchedRowProps> = ({ text, onUserResolved }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  
  // State for Registration
  const [formData, setFormData] = useState({
    first_name: text.split(' ')[0] || '',
    last_name: text.split(' ').slice(1).join(' ') || '',
    document_type: 'V',
    document_number: '',
  });
  const [regError, setRegError] = useState<string | null>(null);
  const [isRegLoading, setIsRegLoading] = useState(false);

  // State for Linking
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);

  // Handlers for Registration
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegLoading(true);
    setRegError(null);

    try {
      const response = await apiClient.post<User>('/users/quick-create/', formData);
      const newUser: MatchedUser = {
        user_id: response.data.id,
        detected_name: text,
        matched_name: `${response.data.first_name} ${response.data.last_name}`,
        confidence: 100,
      };
      onUserResolved(newUser);
    } catch (err) {
      if (isAxiosError(err) && err.response) {
        setRegError(Object.values(err.response.data).join(' '));
      } else {
        setRegError('Error de red al crear el usuario.');
      }
    } finally {
      setIsRegLoading(false);
    }
  };
  
  // Handler for Linking
  const handleLinkUser = (user: User) => {
    const linkedUser: MatchedUser = {
      user_id: user.id,
      detected_name: text,
      matched_name: `${user.first_name} ${user.last_name}`,
      confidence: 100, // Manual link is 100% confidence
    };
    onUserResolved(linkedUser);
  };

  // Effect for searching
  useEffect(() => {
    if (debouncedSearchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      setIsSearchLoading(true);
      try {
        const response = await apiClient.get<User[]>(`/users/search/?q=${debouncedSearchQuery}`);
        setSearchResults(response.data);
      } catch (error) {
        console.error("Failed to search users:", error);
      } finally {
        setIsSearchLoading(false);
      }
    };

    searchUsers();
  }, [debouncedSearchQuery]);


  return (
    <li className="p-3 bg-slate-900/50 rounded-lg border border-slate-700 transition-all">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-100">{text}</span>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setIsLinking(false); }}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${isRegistering ? 'bg-blue-600 text-white' : 'bg-slate-700 text-blue-400 hover:bg-slate-600'}`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Nuevo
          </button>
          <button 
            onClick={() => { setIsLinking(!isLinking); setIsRegistering(false); }}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md transition-colors ${isLinking ? 'bg-purple-600 text-white' : 'bg-slate-700 text-purple-400 hover:bg-slate-600'}`}
          >
            <Link className="w-3.5 h-3.5" />
            Vincular
          </button>
        </div>
      </div>
      
      {isRegistering && (
        <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-3 p-3 bg-slate-800/60 rounded-md animate-fade-in">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} placeholder="Nombre" className="input-form" required />
            <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Apellido" className="input-form" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <select name="document_type" value={formData.document_type} onChange={handleInputChange} className="input-form col-span-1">
              <option value="V">V</option> <option value="E">E</option> <option value="P">P</option>
            </select>
            <input type="text" name="document_number" value={formData.document_number} onChange={handleInputChange} placeholder="Nro. Documento" className="input-form col-span-2" required />
          </div>
          {regError && <p className="text-xs text-red-400">{regError}</p>}
          <button type="submit" disabled={isRegLoading} className="btn-primary w-full">
            {isRegLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear y Vincular Usuario'}
          </button>
        </form>
      )}

      {isLinking && (
        <div className="mt-4 space-y-2 p-3 bg-slate-800/60 rounded-md animate-fade-in">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, apellido, cédula..."
                className="input-form pl-9 w-full"
              />
              {isSearchLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />}
           </div>
           {searchResults.length > 0 && (
             <ul className="space-y-1 pt-2 max-h-40 overflow-y-auto">
               {searchResults.map(user => (
                 <li key={user.id} className="p-2 rounded-md hover:bg-purple-500/10 cursor-pointer" onClick={() => handleLinkUser(user)}>
                    <p className="text-sm font-medium text-slate-100">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-slate-400">{user.document_type}-{user.document_number}</p>
                 </li>
               ))}
             </ul>
           )}
        </div>
      )}
    </li>
  );
};

// Simple helper styles for inputs and buttons to keep component self-contained
const styles = `
.input-form {
  background-color: #1e293b; 
  border: 1px solid #334155; 
  color: #cbd5e1; 
  border-radius: 6px; 
  padding: 8px 12px; 
  font-size: 14px; 
  width: 100%; 
  transition: border-color 0.2s;
}
.input-form:focus { 
  outline: none; 
  border-color: #facc15; 
}
.btn-primary { 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  gap: 8px; 
  background-color: #facc15; 
  color: #1e293b; 
  font-weight: 600; 
  padding: 8px 12px; 
  border-radius: 6px; 
  border: none; 
  cursor: pointer; 
  transition: background-color 0.2s; 
}
.btn-primary:hover { 
  background-color: #eab308; 
}
.btn-primary:disabled { 
  opacity: 0.5; 
  cursor: not-allowed; 
}
.animate-fade-in { 
  animation: fadeIn 0.3s ease-out; 
}
@keyframes fadeIn { 
  from { opacity: 0; transform: translateY(-10px); } 
  to { opacity: 1; transform: translateY(0); } 
}
`;

const styleSheet = document.getElementById('shared-styles');
if (!styleSheet) {
  const newStyleSheet = document.createElement("style");
  newStyleSheet.id = 'shared-styles';
  newStyleSheet.innerText = styles;
  document.head.appendChild(newStyleSheet);
}
