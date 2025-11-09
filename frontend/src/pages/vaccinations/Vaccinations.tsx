import type { FormEvent } from 'react'
import React, { useState } from 'react';
import { Calendar, Stethoscope, Pencil, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import type { Vaccination, FamilyMember } from '../../types/family';
import { useFamilyMembers } from '../../hooks/family';
import {
  useVaccinations,
  useAddVaccination,
  useUpdateVaccination,
  useDeleteVaccination,
} from '../../hooks/vaccinations';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';

interface VaccinationCardProps {
  vaccination: Vaccination;
  member?: FamilyMember;
  activeFamilyId?: number
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const VaccinationCard: React.FC<VaccinationCardProps> = ({ vaccination, member, activeFamilyId, onEdit, onDelete, isDeleting }) => {

  const memberName = member ? `${member.first_name} ${member.last_name}` : 'Desconocido';
  const initials = member ? `${member.first_name?.[0] || ''}${member.last_name?.[0] || ''}` : 'D';
  const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:8000`;

  return (
    <div className="flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:-translate-y-1">

      <div className="bg-gradient-to-br from-orange-50 to-white p-4 rounded-t-xl border-b border-orange-100">
        <div className="mb-3">
          <span className="inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-orange-800">
            {vaccination.vaccine_name}
          </span>
        </div>

        {/* Member Info */}
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full mr-3 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
            <img
              key={member?.id}
              src={member ? `${API_URL}/families/${activeFamilyId}/members/${member.id}/photo` : ''}
              alt={memberName}
              loading="lazy"
              className="h-full w-full object-cover select-none"
              onError={(e) => {
                const target = e.currentTarget;
                target.src = 'data:image/svg+xml;charset=UTF-8,' +
                  encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#262626"/><stop offset="100%" stop-color="#1f2937"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="160" fill="#9ca3af" font-family="system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif" letter-spacing="2">${initials}</text></svg>
              `);
              }}
            />
          </div>
          <p className="font-medium text-orange-900">{memberName}</p>
        </div>
      </div>

      <div className="p-4 space-y-4 flex-grow">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Date */}
          <div className="space-y-1">
            <div className="flex items-center text-xs text-gray-500 font-semibold uppercase">
              <Calendar className="w-4 h-4 mr-1.5 text-orange-600" />
              <span>Fecha</span>
            </div>
            <p className="text-sm font-bold text-orange-900 pl-6">
              {formatDate(vaccination.date_administered)}
            </p>
          </div>

          {/* Administered By */}
          <div className="space-y-1">
            <div className="flex items-center text-xs text-gray-500 font-semibold uppercase">
              <Stethoscope className="w-4 h-4 mr-1.5 text-orange-600" />
              <span>Administrado por</span>
            </div>
            <p className="text-sm font-bold text-orange-900 pl-6">
              {vaccination.administered_by || 'N/A'}
            </p>
          </div>
        </div>

        {vaccination.notes && (
          <>
            <hr className="border-gray-100" />
            <div className="border-l-4 border-orange-200 bg-orange-50 p-3 rounded-r-md">
              <p className="text-sm text-orange-900 italic leading-relaxed">{vaccination.notes}</p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-end space-x-1 p-2 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
        <button
          onClick={onEdit}
          className="p-2 text-gray-400 hover:text-orange-600 rounded-full hover:bg-gray-100 cursor-pointer"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const VaccinationsPage: React.FC = () => {
  const { activeFamily } = useAuth();
  const { data: vaccinations, isLoading: isLoadingVaccinations } = useVaccinations();
  const { members: familyMembers, memberById: memberMap, isLoading: isLoadingMembers } = useFamilyMembers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [vaccinationToDelete, setVaccinationToDelete] = useState<Vaccination | null>(null);

  const addVaccinationMutation = useAddVaccination();
  const updateVaccinationMutation = useUpdateVaccination();
  const deleteVaccinationMutation = useDeleteVaccination();

  const handleOpenAddModal = () => {
    setEditingVaccination(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vaccination: Vaccination) => {
    setEditingVaccination(vaccination);
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (vaccination: Vaccination) => {
    setVaccinationToDelete(vaccination);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setVaccinationToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleFormSubmit = (formData: any) => {
    if (!activeFamily) return;

    if (editingVaccination) {
      updateVaccinationMutation.mutate(
        { familyId: activeFamily.id, vaccinationId: editingVaccination.id, updatedVaccination: formData },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      addVaccinationMutation.mutate(
        { familyId: activeFamily.id, newVaccination: formData },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const handleDeleteVaccination = (vaccinationId: number) => {
    if (!activeFamily) return;
    if (window.confirm('Estas seguro de que quieres borrar este registro de vacuna?')) {
      deleteVaccinationMutation.mutate({ familyId: activeFamily.id, vaccinationId });
    }
  };

  const handleConfirmDelete = () => {
    if (!activeFamily || !vaccinationToDelete) return;

    deleteVaccinationMutation.mutate(
      { familyId: activeFamily.id, vaccinationId: vaccinationToDelete.id },
      {
        onSuccess: () => {
          handleCloseDeleteModal();
        }
      }
    );
  };

  const isLoading = isLoadingVaccinations || isLoadingMembers;

  return (
    <div className="space-y-8 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Vacunas</h2>
        <button
          onClick={handleOpenAddModal}
          className="bg-orange-500 text-white rounded-full p-3 sm:rounded-lg sm:px-4 sm:py-2 flex items-center sm:space-x-2 transition-colors hover:bg-orange-600 fixed bottom-6 right-6 sm:static shadow-lg sm:shadow-none z-30 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline font-semibold">Agregar vacuna</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-orange-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vaccinations?.map(vaccination => (
            <VaccinationCard
              key={vaccination.id}
              vaccination={vaccination}
              member={memberMap.get(vaccination.member_id)}
              activeFamilyId={activeFamily?.id}
              onEdit={() => handleOpenEditModal(vaccination)}
              onDelete={() => handleOpenDeleteModal(vaccination)}
              isDeleting={
                deleteVaccinationMutation.isPending &&
                deleteVaccinationMutation.variables?.vaccinationId === vaccination.id
              }
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <VaccinationFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={editingVaccination}
          familyMembers={familyMembers || []}
          isLoading={addVaccinationMutation.isPending || updateVaccinationMutation.isPending}
        />
      )}

      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          isLoading={deleteVaccinationMutation.isPending}
        />
      )}
    </div>
  );
};

interface VaccinationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData: Vaccination | null;
  familyMembers: FamilyMember[];
  isLoading: boolean;
}

const VaccinationFormModal: React.FC<VaccinationFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, familyMembers, isLoading }) => {
  const [formData, setFormData] = useState({
    member_id: initialData?.member_id || '',
    vaccine_name: initialData?.vaccine_name || '',
    date_administered: initialData?.date_administered || '',
    administered_by: initialData?.administered_by || '',
    notes: initialData?.notes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, member_id: Number(formData.member_id) });
  };

  if (!isOpen) return null;

  const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Editar registro de vacuna' : 'Agregar nuevo registro de vacuna'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label htmlFor="member_id" className="block text-sm font-medium text-gray-700">Paciente</label>
            <select
              name="member_id"
              id="member_id"
              value={formData.member_id}
              onChange={handleChange}
              required
              disabled={!!initialData}
              className={`${inputStyle} ${initialData ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="" disabled>Selecciona un miembro de la familia...</option>
              {familyMembers.map(member => <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>)}
            </select>
          </div>

          <div>
            <label htmlFor="vaccine_name" className="block text-sm font-medium text-gray-700">Nombre de la vacuna</label>
            <input type="text" name="vaccine_name" id="vaccine_name" value={formData.vaccine_name} onChange={handleChange} required className={inputStyle} />
          </div>

          <div>
            <label htmlFor="date_administered" className="block text-sm font-medium text-gray-700">Fecha de administración</label>
            <input type="date" name="date_administered" id="date_administered" value={formData.date_administered} onChange={handleChange} required className={inputStyle} />
          </div>

          <div>
            <label htmlFor="administered_by" className="block text-sm font-medium text-gray-700">Administrado por (opcional)</label>
            <input type="text" name="administered_by" id="administered_by" value={formData.administered_by} onChange={handleChange} className={inputStyle} />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notas (opcional)</label>
            <textarea
              name="notes"
              id="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className={inputStyle}
            ></textarea>
          </div>

          <div className="pt-6 flex justify-end space-x-4">
            <button type="button" onClick={onClose} disabled={isLoading} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 cursor-pointer">Cancelar</button>
            <button type="submit" disabled={isLoading} className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center cursor-pointer">
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
              {initialData ? 'Guardar cambios' : 'Agregar vacuna'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VaccinationsPage;