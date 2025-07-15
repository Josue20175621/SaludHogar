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
        <h2 className="text-2xl font-bold text-gray-800">Medications</h2>
        <button
          onClick={handleOpenAddModal}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Medication</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {medications?.map(medication => (
          <MedicationCard
            key={medication.id}
            medication={medication}
            memberName={memberMap.get(medication.member_id) || 'Unknown'}
            onEdit={() => handleOpenEditModal(medication)}
            onDelete={() => handleDeleteMedication(medication.id)}
            isDeleting={deleteMedicationMutation.isPending && deleteMedicationMutation.variables?.medicationId === medication.id}
          />
        ))}
      </div>

      {isModalOpen && (
        <MedicationFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={editingMedication}
          familyMembers={familyMembers || []}
          isLoading={addMedicationMutation.isPending || updateMedicationMutation.isPending}
        />
      )}
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
        <div className="flex space-x-1">
          <button onClick={onEdit} className="p-2 text-gray-400 hover:text-cyan-600 rounded-full hover:bg-gray-100 transition-colors" aria-label={`Edit ${medication.name}`}>
            <Edit className="w-5 h-5" />
          </button>
          <button onClick={onDelete} disabled={isDeleting} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100 disabled:opacity-50 transition-colors" aria-label={`Delete ${medication.name}`}>
            {isDeleting ? <div className="w-5 h-5 border-2 border-gray-400 border-t-red-600 rounded-full animate-spin"></div> : <Trash2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-500">Dosage:</span>
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium">{medication.dosage}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-500">Frequency:</span>
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">{medication.frequency}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-500">Start Date:</span>
          <span className="text-gray-700">{medication.start_date ? formatDate(medication.start_date) : 'N/A'}</span>
        </div>
        {medication.end_date && (
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-500">End Date:</span>
            <span className="text-gray-700">{formatDate(medication.end_date)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-500">Prescribed by:</span>
          <span className="text-gray-700">{medication.prescribed_by || 'N/A'}</span>
        </div>
      </div>

      {(medication.notes || isActive()) && (
        <div className="mt-4 pt-4 border-t">
          {isActive() && (
            <div className="flex items-center space-x-2 text-green-600 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">Currently Active</span>
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

          {/* Patient Select Dropdown */}
          <div>
            <label htmlFor="member_id" className="block text-sm font-medium text-gray-700">Patient</label>
            <select name="member_id" id="member_id" value={formData.member_id} onChange={handleChange} required className={inputStyle}>
              <option value="" disabled>Select a family member...</option>
              {familyMembers.map(member => (
                <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>
              ))}
            </select>
          </div>

          {/* Medication Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Medication Name</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className={inputStyle} />
          </div>

          {/* Dosage and Frequency side-by-side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dosage" className="block text-sm font-medium text-gray-700">Dosage (e.g., 10mg)</label>
              <input type="text" name="dosage" id="dosage" value={formData.dosage} onChange={handleChange} required className={inputStyle} />
            </div>
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700">Frequency (e.g., Once daily)</label>
              <input type="text" name="frequency" id="frequency" value={formData.frequency} onChange={handleChange} required className={inputStyle} />
            </div>
          </div>

          {/* Start and End Date side-by-side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Start Date</label>
              <input type="date" name="start_date" id="start_date" value={formData.start_date} onChange={handleChange} className={inputStyle} />
            </div>
            <div>
              <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">End Date (Optional)</label>
              <input type="date" name="end_date" id="end_date" value={formData.end_date} onChange={handleChange} className={inputStyle} />
            </div>
          </div>

          <div>
            <label htmlFor="prescribed_by" className="block text-sm font-medium text-gray-700">Prescribed By</label>
            <input type="text" name="prescribed_by" id="prescribed_by" value={formData.prescribed_by} onChange={handleChange} className={inputStyle} />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputStyle}></textarea>
          </div>

          <div className="pt-6 flex justify-end space-x-4">
            <button type="button" onClick={onClose} disabled={isLoading} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center transition-colors">
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
              {initialData ? 'Save Changes' : 'Add Medication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Medications;