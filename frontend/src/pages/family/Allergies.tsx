import React from 'react';
import { useMedicalHistory, useMedicalHistoryMutations } from '../../hooks/medicalHistory';
import { HistoryListSection } from '../../components/HistoryListSection';

export const Allergies: React.FC<{ memberId: string }> = ({ memberId }) => {
  const { data: allergies, isLoading } = useMedicalHistory('allergies', memberId);
  const { addItem, editItem, deleteItem } = useMedicalHistoryMutations('allergies', memberId);

  return (
    <HistoryListSection
      title="Alergias"
      data={allergies}
      isLoading={isLoading}
      onAdd={values => addItem.mutate(values)}
      onEdit={(id, values) => editItem.mutate({ id, data: values })}
      onDelete={id => deleteItem.mutate(id)}
      renderItem={allergy => (
        <div>
          <span
            className={`font-semibold ${allergy.is_severe ? 'text-red-600' : ''}`}
          >
            {allergy.name}
          </span>
          <p className="text-sm text-gray-600">
            Categoría: {allergy.category || 'N/D'}
          </p>
          <p className="text-sm text-gray-600">
            Reacción: {allergy.reaction || 'N/D'}
          </p>
        </div>
      )}
      renderForm={({ initialData, onSubmit, onCancel }) => (
        <form
          onSubmit={e => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const name = (form.elements.namedItem('name') as HTMLInputElement).value;
            const category = (form.elements.namedItem('category') as HTMLInputElement).value;
            const reaction = (form.elements.namedItem('reaction') as HTMLInputElement).value;
            const is_severe = (form.elements.namedItem('is_severe') as HTMLInputElement).checked;

            onSubmit({ name, category, reaction, is_severe });
          }}
          className="space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              name="name"
              defaultValue={initialData?.name || ''}
              placeholder="Nombre de la alergia"
              className="border rounded-md p-2 w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Categoría</label>
            <input
              name="category"
              defaultValue={initialData?.category || ''}
              placeholder="Categoría"
              className="border rounded-md p-2 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reacción</label>
            <input
              name="reaction"
              defaultValue={initialData?.reaction || ''}
              placeholder="Reacción"
              className="border rounded-md p-2 w-full"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_severe"
              defaultChecked={initialData?.is_severe || false}
              className="mr-2"
            />
            <label htmlFor="is_severe" className="text-sm text-gray-700">
              Es severa
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
  );
};
