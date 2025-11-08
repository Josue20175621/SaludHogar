import React from 'react';
import { useMedicalHistory, useMedicalHistoryMutations } from '../../hooks/medicalHistory';
import { HistoryListSection } from '../../components/HistoryListSection';
import { formatDate } from '../../utils/formatters';
import type { Surgery } from '../../types/family';

export const Surgeries: React.FC<{ memberId: string }> = ({ memberId }) => {
  const { data: surgeries, isLoading } = useMedicalHistory('surgeries', memberId);
  const { addItem, editItem, deleteItem } = useMedicalHistoryMutations('surgeries', memberId);

  return (
    <HistoryListSection<Surgery>
      title="Cirugías"
      data={surgeries}
      isLoading={isLoading}
      onAdd={(values) => addItem.mutate(values)}
      onEdit={(id, values) => editItem.mutate({ id, data: values })}
      onDelete={(id) => deleteItem.mutate(id)}
      renderItem={(surgery) => (
        <div>
          <span className="font-semibold">{surgery.name}</span>
          <p className="text-sm text-gray-600">
            Fecha: {formatDate(surgery.date_of_procedure)}
          </p>
          {surgery.surgeon_name && (
            <p className="text-sm text-gray-600">Cirujano: {surgery.surgeon_name}</p>
          )}
          {surgery.facility_name && (
            <p className="text-sm text-gray-600">Centro médico: {surgery.facility_name}</p>
          )}
          {surgery.notes && (
            <p className="text-sm text-gray-500 mt-1 italic">"{surgery.notes}"</p>
          )}
        </div>
      )}
      renderForm={({ initialData, onSubmit, onCancel }) => (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const name = (form.elements.namedItem('name') as HTMLInputElement).value;
            const date_of_procedure = (form.elements.namedItem('date_of_procedure') as HTMLInputElement).value;
            const surgeon_name = (form.elements.namedItem('surgeon_name') as HTMLInputElement).value;
            const facility_name = (form.elements.namedItem('facility_name') as HTMLInputElement).value;
            const notes = (form.elements.namedItem('notes') as HTMLInputElement).value;

            onSubmit({
              name,
              date_of_procedure: date_of_procedure || undefined,
              surgeon_name,
              facility_name,
              notes,
            });
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              name="name"
              defaultValue={initialData?.name || ''}
              placeholder="Nombre de la cirugía"
              className="border rounded-md p-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de procedimiento</label>
            <input
              type="date"
              name="date_of_procedure"
              defaultValue={initialData?.date_of_procedure || ''}
              className="border rounded-md p-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Cirujano</label>
            <input
              name="surgeon_name"
              defaultValue={initialData?.surgeon_name || ''}
              placeholder="Nombre del cirujano"
              className="border rounded-md p-2 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Centro médico</label>
            <input
              name="facility_name"
              defaultValue={initialData?.facility_name || ''}
              placeholder="Nombre del hospital o clínica"
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
              rows={2}
            />
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
  );
};
