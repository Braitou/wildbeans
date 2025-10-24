'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

interface StatsTableProps {
  data: any[];
  columns: {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
  }[];
  title?: string;
  searchPlaceholder?: string;
}

export default function StatsTable({ 
  data, 
  columns, 
  title = "Tableau des Statistiques",
  searchPlaceholder = "Rechercher..."
}: StatsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    const lowerSearch = searchTerm.toLowerCase();
    return data.filter(row =>
      columns.some(col => {
        const value = row[col.key];
        if (value == null) return false;
        return String(value).toLowerCase().includes(lowerSearch);
      })
    );
  }, [data, searchTerm, columns]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        {title && (
          <h3 className="text-sm font-bold uppercase tracking-wide">
            {title}
          </h3>
        )}
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-none text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left bg-gray-50">
            <tr>
              {columns.map(col => (
                <th 
                  key={col.key}
                  className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-gray-600 border-b-2 border-gray-200"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-8 text-center text-gray-500">
                  Aucun résultat trouvé
                </td>
              </tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  {columns.map(col => (
                    <td key={col.key} className="py-3 px-4 border-b border-gray-100">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        {filteredData.length} résultat{filteredData.length > 1 ? 's' : ''} 
        {searchTerm && ` sur ${data.length} total`}
      </div>
    </div>
  );
}

