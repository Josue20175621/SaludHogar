import React from 'react';
import {
  useFamilyHistoryConditions,
  useFamilyHistoryConditionMutations,
} from '../../hooks/medicalHistory';
import { HistoryListSection } from '../../components/HistoryListSection';
import { type FamilyHistoryCondition as FamilyHistoryConditionType } from '../../types/family';

export const FamilyHistoryConditions: React.FC = () => {
  const { data: conditions, isLoading } = useFamilyHistoryConditions();
  const { addFamilyHistory, editFamilyHistory, deleteFamilyHistory } =
    useFamilyHistoryConditionMutations();

  return (
    <HistoryListSection<FamilyHistoryConditionType>
      title="Antecedentes Familiares"
      data={conditions}
      isLoading={isLoading}
      onAdd={values => addFamilyHistory.mutate(values)}
      onEdit={(id, values) => editFamilyHistory.mutate({ id, data: values })}
      onDelete={id => deleteFamilyHistory.mutate(id)}
      renderItem={condition => (
        <div>
          <span className="font-semibold">{condition.condition_name}</span>
          <p className="text-sm text-gray-600">
            Familiar: {condition.relative}
          </p>
          {condition.notes && (
            <p className="text-sm text-gray-600">Notas: {condition.notes}</p>
          )}
        </div>
      )}
      renderForm={({ initialData, onSubmit, onCancel }) => (
        <form
          onSubmit={e => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const condition_name = (
              form.elements.namedItem('condition_name') as HTMLInputElement
            ).value;
            const relative = (
              form.elements.namedItem('relative') as HTMLInputElement
            ).value;
            const notes = (
              form.elements.namedItem('notes') as HTMLInputElement
            ).value;

            onSubmit({ condition_name, relative, notes });
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Condición
            </label>
            <input
              name="condition_name"
              defaultValue={initialData?.condition_name || ''}
              placeholder="Ej. Diabetes, Hipertensión..."
              className="border rounded-md p-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Familiar
            </label>
            <input
              name="relative"
              defaultValue={initialData?.relative || ''}
              placeholder="Ej. Madre, Padre, Hermano..."
              className="border rounded-md p-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notas
            </label>
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
