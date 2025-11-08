import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';

export interface HistoryListSectionProps<T extends { id: number }> {
  title: string;
  data?: T[];
  isLoading: boolean;
  renderItem: (item: T) => React.ReactNode;
  renderForm: (props: {
    initialData?: T;
    onSubmit: (values: Partial<T>) => void;
    onCancel: () => void;
  }) => React.ReactNode;
  onAdd: (values: Partial<T>) => void;
  onEdit: (id: number, values: Partial<T>) => void;
  onDelete: (id: number) => void;
}

export function HistoryListSection<T extends { id: number }>({
  title,
  data,
  isLoading,
  renderItem,
  renderForm,
  onAdd,
  onEdit,
  onDelete,
}: HistoryListSectionProps<T>) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <header className="flex justify-between items-center p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="p-2 rounded-md bg-gradient-to-r from-emerald-600 to-cyan-600 
             text-white hover:shadow-md transition-all duration-200"
          title="Agregar"
        >
          <Plus className="h-4 w-4" />
        </button>
      </header>

      <div className="p-4">
        {isLoading ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : data && data.length > 0 ? (
          <ul className="space-y-3">
            {data.map(item => (
              <li
                key={item.id}
                className="p-3 bg-gray-50 rounded-md flex justify-between items-center"
              >
                <div>{renderItem(item)}</div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-1 rounded-md bg-gradient-to-r from-emerald-600 to-cyan-600 
             text-white hover:shadow-md transition-all duration-200"
                    title="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="p-1 rounded bg-gradient-to-r from-rose-600 to-red-600 
             text-white hover:shadow-md transition-all duration-200"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No hay {title.toLowerCase()} registrados.
          </p>
        )}
      </div>

      {(isAdding || editingItem) && (
        <div className="p-4 border-t bg-gray-50 relative">
          <button
            onClick={() => {
              setIsAdding(false);
              setEditingItem(null);
            }}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            title="Cerrar formulario"
          >
            <X className="h-5 w-5" />
          </button>
          {renderForm({
            initialData: editingItem || undefined,
            onSubmit: values => {
              if (editingItem) onEdit(editingItem.id, values);
              else onAdd(values);
              setIsAdding(false);
              setEditingItem(null);
            },
            onCancel: () => {
              setIsAdding(false);
              setEditingItem(null);
            },
          })}
        </div>
      )}
    </div>
  );
}
