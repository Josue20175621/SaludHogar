import React from 'react';
import { useMedicalHistory, useMedicalHistoryMutations } from '../../hooks/medicalHistory';
import { HistoryListSection } from '../../components/HistoryListSection';
import { formatDate } from '../../utils/formatters';
import type { Hospitalization } from '../../types/family';

export const Hospitalizations: React.FC<{ memberId: string }> = ({ memberId }) => {
  const { data: hospitalizations, isLoading } = useMedicalHistory('hospitalizations', memberId);
  const { addItem, editItem, deleteItem } = useMedicalHistoryMutations('hospitalizations', memberId);

  return (
    <HistoryListSection<Hospitalization>
      title="Hospitalizaciones"
      data={hospitalizations}
      isLoading={isLoading}
      onAdd={values => addItem.mutate(values)}
      onEdit={(id, values) => editItem.mutate({ id, data: values })}
      onDelete={id => deleteItem.mutate(id)}
      renderItem={hospitalization => (
        <div>
          <span className="font-semibold">{hospitalization.reason}</span>
          <p className="text-sm text-gray-600">
            Ingreso: {hospitalization.admission_date ? formatDate(hospitalization.admission_date) : 'N/D'}
            {hospitalization.discharge_date && ` - Alta: ${formatDate(hospitalization.discharge_date)}`}
          </p>
          {hospitalization.facility_name && (
            <p className="text-sm text-gray-600">
              Centro médico: {hospitalization.facility_name}
            </p>
          )}
          {hospitalization.notes && (
            <p className="text-sm text-gray-500 mt-1 italic">
              "{hospitalization.notes}"
            </p>
          )}
        </div>
      )}
      renderForm={({ initialData, onSubmit, onCancel }) => (
        <form
          onSubmit={e => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;

            const reason = (form.elements.namedItem('reason') as HTMLInputElement).value;
            const admission_date = (form.elements.namedItem('admission_date') as HTMLInputElement).value || undefined;
            const discharge_date = (form.elements.namedItem('discharge_date') as HTMLInputElement).value || undefined;
            const facility_name = (form.elements.namedItem('facility_name') as HTMLInputElement).value || undefined;
            const notes = (form.elements.namedItem('notes') as HTMLInputElement).value || undefined;

            onSubmit({ reason, admission_date, discharge_date, facility_name, notes });
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">Motivo</label>
            <input
              name="reason"
              defaultValue={initialData?.reason || ''}
              placeholder="Motivo de la hospitalización"
              className="border rounded-md p-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de ingreso</label>
            <input
              type="date"
              name="admission_date"
              defaultValue={initialData?.admission_date || ''}
              className="border rounded-md p-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de alta</label>
            <input
              type="date"
              name="discharge_date"
              defaultValue={initialData?.discharge_date || ''}
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
            <input
              name="notes"
              defaultValue={initialData?.notes || ''}
              placeholder="Notas adicionales"
              className="border rounded-md p-2 w-full"
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