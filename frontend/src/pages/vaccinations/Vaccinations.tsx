import type {FormEvent} from 'react'
import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
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

const VaccinationsPage: React.FC = () => {
  const { activeFamily } = useAuth();
  const { data: vaccinations, isLoading: isLoadingVaccinations } = useVaccinations();
  const { members: familyMembers, memberMap, isLoading: isLoadingMembers } = useFamilyMembers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null);

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
    if (window.confirm('Are you sure you want to delete this vaccination record?')) {
      deleteVaccinationMutation.mutate({ familyId: activeFamily.id, vaccinationId });
    }
  };

  const isLoading = isLoadingVaccinations || isLoadingMembers;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Vaccinations</h2>
        <button
          onClick={handleOpenAddModal}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Vaccination</span>
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-orange-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left p-4 font-medium">Patient</th>
                  <th className="text-left p-4 font-medium">Vaccine</th>
                  <th className="text-left p-4 font-medium">Date Administered</th>
                  <th className="text-left p-4 font-medium">Administered By</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vaccinations?.map(vaccination => (
                  <tr key={vaccination.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{memberMap.get(vaccination.member_id) || 'Unknown'}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                        {vaccination.vaccine_name}
                      </span>
                    </td>
                    <td className="p-4 text-gray-700">{formatDate(vaccination.date_administered)}</td>
                    <td className="p-4 text-gray-700">{vaccination.administered_by || 'N/A'}</td>
                    <td className="p-4">
                      <div className="flex space-x-1">
                        <button onClick={() => handleOpenEditModal(vaccination)} className="p-2 text-gray-400 hover:text-cyan-600 rounded-full hover:bg-gray-100">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteVaccination(vaccination.id)} disabled={deleteVaccinationMutation.isPending && deleteVaccinationMutation.variables?.vaccinationId === vaccination.id} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100 disabled:opacity-50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Edit Vaccination Record' : 'Add New Vaccination Record'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <label htmlFor="member_id" className="block text-sm font-medium text-gray-700">Patient</label>
          <select name="member_id" id="member_id" value={formData.member_id} onChange={handleChange} required className={inputStyle}>
            <option value="" disabled>Select a family member...</option>
            {familyMembers.map(member => <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>)}
          </select>
          
          <label htmlFor="vaccine_name" className="block text-sm font-medium text-gray-700">Vaccine Name</label>
          <input type="text" name="vaccine_name" id="vaccine_name" value={formData.vaccine_name} onChange={handleChange} required className={inputStyle} />
          
          <label htmlFor="date_administered" className="block text-sm font-medium text-gray-700">Date Administered</label>
          <input type="date" name="date_administered" id="date_administered" value={formData.date_administered} onChange={handleChange} required className={inputStyle} />
          
          <label htmlFor="administered_by" className="block text-sm font-medium text-gray-700">Administered By (Optional)</label>
          <input type="text" name="administered_by" id="administered_by" value={formData.administered_by} onChange={handleChange} className={inputStyle} />

          <div className="pt-6 flex justify-end space-x-4">
            <button type="button" onClick={onClose} disabled={isLoading} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" disabled={isLoading} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center">
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
              {initialData ? 'Save Changes' : 'Add Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VaccinationsPage;