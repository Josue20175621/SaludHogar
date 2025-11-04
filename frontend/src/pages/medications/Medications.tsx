import type { FormEvent } from 'react'
import React, { useState } from 'react';
import { Calendar, User, Beaker, Repeat, Clock } from 'lucide-react';
import type { Medication, FamilyMember } from '../../types/family';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import { useFamilyMembers } from '../../hooks/family';
import {
  useMedications,
  useAddMedication,
  useUpdateMedication,
  useDeleteMedication,
} from '../../hooks/medications';

const Medications: React.FC = () => {
  const { activeFamily } = useAuth();
  const { data: medications, isLoading: isLoadingMedications } = useMedications();
  const { memberById: memberMap, isLoading: isLoadingMembers } = useFamilyMembers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);

  const addMedicationMutation = useAddMedication();
  const updateMedicationMutation = useUpdateMedication();
  const deleteMedicationMutation = useDeleteMedication();

  const handleOpenAddModal = () => {
    setEditingMedication(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (medication: Medication) => {
    setEditingMedication(medication);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (formData: any) => {
    if (!activeFamily) return;

    if (editingMedication) {
      updateMedicationMutation.mutate(
        { familyId: activeFamily.id, medicationId: editingMedication.id, updatedMedication: formData },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      addMedicationMutation.mutate(
        { familyId: activeFamily.id, newMedication: formData },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const handleDeleteMedication = (medicationId: number) => {
    if (!activeFamily) return;
    if (window.confirm('Are you sure you want to delete this medication record?')) {
      deleteMedicationMutation.mutate({ familyId: activeFamily.id, medicationId });
    }
  };

  if (isLoadingMedications || isLoadingMembers) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Medicamentos</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {medications?.map(medication => (
          <MedicationCard
            key={medication.id}
            medication={medication}
            member={memberMap.get(medication.member_id)}
            activeFamilyId={activeFamily?.id}
            isDeleting={deleteMedicationMutation.isPending && deleteMedicationMutation.variables?.medicationId === medication.id}
          />
        ))}
      </div>
    </div>
  );
};

interface MedicationCardProps {
  medication: Medication;
  member?: FamilyMember;
  activeFamilyId?: number
  isDeleting: boolean;
}

const MedicationCard: React.FC<MedicationCardProps> = ({ medication, member, activeFamilyId, isDeleting }) => {
  // A helper to determine if the medication is currently active based on our business logic
  const isActive = () => {
    if (!medication.start_date) return false; // Must have a start date to be active
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today to the start of the day

    const startDate = new Date(medication.start_date);

    if (startDate > today) return false; // Hasn't started yet

    if (medication.end_date) {
      const endDate = new Date(medication.end_date);
      return endDate >= today; // It's active if the end date is today or in the future
    }

    return true; // No end date, so it's ongoing
  };

  const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:8000`;

  return (
    <div className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-t-xl border-b border-purple-100">
        <div className="flex items-center justify-between">

          {/* Foto de perfil + detalles */}
          <div className="flex items-center">

            <div className="w-12 h-12 rounded-full mr-4 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
              <img
                key={member?.id}
                src={`${API_URL}/families/${activeFamilyId}/members/${member?.id}/photo`}
                alt={`${member?.first_name} ${member?.last_name}`}
                loading="lazy"
                className="h-full w-full object-cover select-none"
                onError={(e) => {
                  const target = e.currentTarget;
                  const initials = `${member?.first_name?.[0] || ''}${member?.last_name?.[0] || ''}`;
                  target.src = 'data:image/svg+xml;charset=UTF-8,' +
                    encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#262626"/><stop offset="100%" stop-color="#1f2937"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="160" fill="#9ca3af" font-family="system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif" letter-spacing="2">${initials}</text></svg>
              `);
                }}
              />
            </div>

            <div>
              <h3 className="font-bold text-lg text-purple-900">{medication.name}</h3>
              <p className="text-purple-500 text-sm font-bold">{`${member?.first_name} ${member?.last_name}`}</p>
            </div>
          </div>

          {isActive() && (
            <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
              Activo
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">

          {/* Dosis */}
          <div className="space-y-1">
            <div className="flex items-center text-xs text-gray-500 font-semibold uppercase">
              <Beaker className="w-4 h-4 mr-1.5 text-purple-900" />
              <span>Dosis</span>
            </div>
            <p className="text-base font-bold text-purple-900 pl-6">{medication.dosage}</p>
          </div>

          {/* Frecuencia */}
          <div className="space-y-1">
            <div className="flex items-center text-xs text-gray-500 font-semibold uppercase">
              <Repeat className="w-4 h-4 mr-1.5 text-purple-900" />
              <span>Frecuencia</span>
            </div>
            <p className="text-base font-bold text-purple-900 pl-6">{medication.frequency}</p>
          </div>

          {/* Inicio */}
          <div className="space-y-1">
            <div className="flex items-center text-xs text-gray-500 font-semibold uppercase">
              <Calendar className="w-4 h-4 mr-1.5 text-purple-900" />
              <span>Inicio</span>
            </div>
            <p className="text-base font-bold text-purple-900 pl-6">
              {medication.start_date ? formatDate(medication.start_date) : 'N/D'}
            </p>
          </div>

          {/* Fin */}
          {medication.end_date && (
            <div className="space-y-1">
              <div className="flex items-center text-xs text-gray-500 font-semibold uppercase">
                <Clock className="w-4 h-4 mr-1.5 text-purple-900" />
                <span>Fin</span>
              </div>
              <p className="text-base font-bold text-purple-900 pl-6">
                {formatDate(medication.end_date)}
              </p>
            </div>
          )}
        </div>

        {/* Divider */}
        {(medication.prescribed_by || medication.notes) && <hr className="border-gray-100" />}

        {/* Doctor */}
        <div className="space-y-3">
          {medication.prescribed_by && (
            <div className="flex items-center space-x-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Prescrito por:</span>
              <span className="font-medium text-gray-800">
                {medication.prescribed_by}
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {medication.notes && (
          <div className="border-l-4 border-purple-200 bg-purple-50 p-3 rounded-r-md">
            <p className="text-sm text-purple-800 italic leading-relaxed">{medication.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface MedicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData: Medication | null;
  familyMembers: FamilyMember[];
  isLoading: boolean;
}

const MedicationFormModal: React.FC<MedicationFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, familyMembers, isLoading }) => {
  const [formData, setFormData] = useState({
    member_id: initialData?.member_id || '',
    name: initialData?.name || '',
    dosage: initialData?.dosage || '',
    frequency: initialData?.frequency || '',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    prescribed_by: initialData?.prescribed_by || '',
    notes: initialData?.notes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Prepare data for submission, ensuring member_id is a number
    // and optional fields are null if empty.
    const submissionData = {
      ...formData,
      member_id: Number(formData.member_id),
      end_date: formData.end_date || null,
      prescribed_by: formData.prescribed_by || null,
      notes: formData.notes || null,
    };
    onSubmit(submissionData);
  };

  if (!isOpen) return null;

  // Nice consistent input style but with a different color
  const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{initialData ? 'Edit Medication' : 'Add New Medication'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Menú desplegable de paciente */}
          <div>
            <label htmlFor="member_id" className="block text-sm font-medium text-gray-700">Paciente</label>
            <select name="member_id" id="member_id" value={formData.member_id} onChange={handleChange} required className={inputStyle}>
              <option value="" disabled>Selecciona un miembro de la familia...</option>
              {familyMembers.map(member => (
                <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>
              ))}
            </select>
          </div>

          {/* Campo para nombre del medicamento */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del medicamento</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className={inputStyle} />
          </div>

          {/* Dosis y frecuencia en paralelo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dosage" className="block text-sm font-medium text-gray-700">Dosis (ej., 10mg)</label>
              <input type="text" name="dosage" id="dosage" value={formData.dosage} onChange={handleChange} required className={inputStyle} />
            </div>
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">Frecuencia (ej., Una vez al día)</label>
              <input type="text" name="frequency" id="frequency" value={formData.frequency} onChange={handleChange} required className={inputStyle} />
            </div>
          </div>

          {/* Fechas de inicio y fin en paralelo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Fecha de inicio</label>
              <input type="date" name="start_date" id="start_date" value={formData.start_date} onChange={handleChange} className={inputStyle} />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">Fecha de finalización (opcional)</label>
              <input type="date" name="end_date" id="end_date" value={formData.end_date} onChange={handleChange} className={inputStyle} />
            </div>
          </div>

          {/* Campo para médico que lo recetó */}
          <div>
            <label htmlFor="prescribed_by" className="block text-sm font-medium text-gray-700">Prescrito por</label>
            <input type="text" name="prescribed_by" id="prescribed_by" value={formData.prescribed_by} onChange={handleChange} className={inputStyle} />
          </div>

          {/* Campo de notas */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notas</label>
            <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputStyle}></textarea>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Medications;