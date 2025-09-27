import type { FormEvent } from 'react'
import React, { useState } from 'react';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
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
  const { members: familyMembers, memberMap, isLoading: isLoadingMembers } = useFamilyMembers();

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Medicamentos</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {medications?.map(medication => (
          <MedicationCard
            key={medication.id}
            medication={medication}
            memberName={memberMap.get(medication.member_id) || 'Desconocido'}
            onEdit={() => handleOpenEditModal(medication)}
            onDelete={() => handleDeleteMedication(medication.id)}
            isDeleting={deleteMedicationMutation.isPending && deleteMedicationMutation.variables?.medicationId === medication.id}
          />
        ))}
      </div>
    </div>
  );
};

interface MedicationCardProps {
  medication: Medication;
  memberName: string;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const MedicationCard: React.FC<MedicationCardProps> = ({ medication, memberName, onEdit, onDelete, isDeleting }) => {
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

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4 pb-4 border-b">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{medication.name}</h3>
          <p className="text-sm text-gray-600">{memberName}</p>
        </div>
      </div>

      {/* Detalles */}
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-500">Dosis:</span>
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium">{medication.dosage}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-500">Frecuencia:</span>
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">{medication.frequency}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-500">Fecha de inicio:</span>
          <span className="text-gray-700">{medication.start_date ? formatDate(medication.start_date) : 'N/D'}</span>
        </div>
        {medication.end_date && (
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-500">Fecha de finalización:</span>
            <span className="text-gray-700">{formatDate(medication.end_date)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-500">Prescrito por:</span>
          <span className="text-gray-700">{medication.prescribed_by || 'N/D'}</span>
        </div>
      </div>

      {(medication.notes || isActive()) && (
        <div className="mt-4 pt-4 border-t">
          {isActive() && (
            <div className="flex items-center space-x-2 text-green-600 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">Activo</span>
            </div>
          )}
          {medication.notes && (
            <p className="text-sm text-gray-600 italic">
              "{medication.notes}"
            </p>
          )}
        </div>
      )}
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