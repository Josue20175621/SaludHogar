import React, { useState } from 'react';
import { useMedicalHistory, useMedicalHistoryMutations } from '../../hooks/medicalHistory';
import { HistoryListSection } from '../../components/HistoryListSection';
import { formatDate } from '../../utils/formatters';
import type { Condition } from '../../types/family';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';

export const Conditions: React.FC<{ memberId: string }> = ({ memberId }) => {
  const { data: conditions, isLoading } = useMedicalHistory('conditions', memberId);
  const { addItem, editItem, deleteItem } = useMedicalHistoryMutations('conditions', memberId);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | number | null>(null);

  const handleOpenDeleteModal = (id: string | number) => {
    setIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIdToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (idToDelete) {
      deleteItem.mutate(idToDelete, {
        onSuccess: () => {
          handleCloseDeleteModal();
        },
      });
    }
  };

  return (
    <>
      <HistoryListSection<Condition>
        title="Condiciones"
        data={conditions}
        isLoading={isLoading}
        onAdd={values => addItem.mutate(values)}
        onEdit={(id, values) => editItem.mutate({ id, data: values })}
        onDelete={handleOpenDeleteModal}
        renderItem={(condition) => (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{condition.name}</span>
              {condition.is_active && (
                <span className="px-2 py-0.5 text-xs font-medium text-white bg-blue-600 rounded-full">
                  Activa
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Diagnosticada:{' '}
              {condition.date_diagnosed ? formatDate(condition.date_diagnosed) : 'N/D'}
            </p>
            {condition.notes && (
              <p className="text-sm text-gray-500 mt-1 italic">"{condition.notes}"</p>
            )}
          </div>
        )}
        renderForm={({ initialData, onSubmit, onCancel }) => (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const name = (form.elements.namedItem('name') as HTMLInputElement).value;
              const date_diagnosed = (form.elements.namedItem('date_diagnosed') as HTMLInputElement).value;
              const notes = (form.elements.namedItem('notes') as HTMLInputElement).value;
              const is_active = (form.elements.namedItem('is_active') as HTMLInputElement).checked;

              onSubmit({
                name,
                date_diagnosed: date_diagnosed || undefined,
                notes,
                is_active,
              });
            }}
            className="space-y-3"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                name="name"
                defaultValue={initialData?.name || ''}
                placeholder="Nombre de la condición"
                className="border rounded-md p-2 w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de diagnóstico</label>
              <input
                type="date"
                name="date_diagnosed"
                defaultValue={initialData?.date_diagnosed || ''}
                className="border rounded-md p-2 w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notas</label>
              <textarea
                name="notes"
                defaultValue={initialData?.notes || ''}
                placeholder="Notas adicionales"
                className="border rounded-md p-2 w-full"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={initialData?.is_active || false}
                className="mr-2"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Activa
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1 text-sm text-gray-600 hover:underline"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </form>
        )}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        isLoading={deleteItem.isPending}
      />
    </>
  );
};