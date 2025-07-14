import React from 'react';
import { Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import type { Medication } from '../../types/family';
import { familyApi } from '../../api/axios';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import { useFamilyMembers } from '../../hooks/family';

const fetchMedications = async (familyId: number): Promise<Medication[]> => {
  const { data } = await familyApi.get(`/${familyId}/medications`);
  return data;
};

const Medications: React.FC = () => {
  const { activeFamily } = useAuth();
  const familyId = activeFamily?.id

  const { data: medications, isLoading: isLoadingMedications } = useQuery<Medication[], Error>({
    queryKey: ['medications', familyId],
    queryFn: () => fetchMedications(familyId!),
    enabled: !!familyId,
  });
  const { memberMap, isLoading: isLoadingMembers } = useFamilyMembers();

  if (isLoadingMedications || isLoadingMembers) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Medications</h2>
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Medication</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {medications?.map(medication => (
          <div key={medication.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{medication.name}</h3>
                <p className="text-gray-600">{memberMap.get(medication.member_id) || 'Unknown Member'}</p>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-gray-400 hover:text-blue-600" aria-label={`Edit ${medication.name}`}>
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600" aria-label={`Delete ${medication.name}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-600">Dosage:</span>
                <span className="bg-gray-100 px-2 py-1 rounded font-medium">{medication.dosage}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-600">Frequency:</span>
                <span className="bg-gray-100 px-2 py-1 rounded">{medication.frequency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-600">Start Date:</span>
                <span className="text-gray-800">{formatDate(medication.start_date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-600">Prescribed by:</span>
                <span className="text-gray-800">{medication.prescribed_by}</span>
              </div>
              {medication.notes && (
                <div className="pt-2 border-t mt-3">
                  <p className="text-gray-600">
                    <span className="font-medium">Notes:</span> {medication.notes}
                  </p>
                </div>
              )}
              {!medication.end_date && (
                <div className="flex items-center space-x-2 text-green-600 mt-3">
                  <AlertCircle className="w-4 h-4" />
                  <span className="font-medium">Currently Active</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Medications;