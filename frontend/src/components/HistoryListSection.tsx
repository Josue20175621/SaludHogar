import React from 'react';
import { Plus } from 'lucide-react';

interface HistoryListSectionProps<T> {
  title: string;
  data: T[] | undefined;
  isLoading: boolean;
  renderItem: (item: T) => React.ReactNode;
}

export function HistoryListSection<T extends { id: number }>({
  title,
  data,
  isLoading,
  renderItem,
}: HistoryListSectionProps<T>) {
  return (
    <div className="bg-white shadow-sm border rounded-lg">
      <header className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </header>
      <div className="p-4">
        {isLoading ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : data && data.length > 0 ? (
          <ul className="space-y-3">
            {data.map(item => (
              <li key={item.id} className="p-3 bg-gray-50 rounded-md">
                {renderItem(item)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No hay {title.toLowerCase()} registrados.</p>
        )}
      </div>
    </div>
  );
}