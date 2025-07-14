import React from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import type { Vaccination } from '../../types/family';
import { familyApi } from '../../api/axios';
import { useFamilyMembers } from '../../hooks/family';

const fetchVaccinations = async (familyId: number): Promise<Vaccination[]> => {
  const { data } = await familyApi.get(`/${familyId}/vaccinations`);
  return data;
};

const Vaccinations: React.FC = () => {

  const { activeFamily } = useAuth();
  const familyId = activeFamily?.id

  const { data: vaccinations, isLoading: isLoadingVaccinations } = useQuery<Vaccination[], Error>({
    queryKey: ['vaccinations', familyId],
    queryFn: () => fetchVaccinations(familyId!),
    enabled: !!familyId,
  });

  const { memberMap, isLoading: isLoadingMembers } = useFamilyMembers();

  if (isLoadingVaccinations || isLoadingMembers) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Vaccinations</h2>
        <button className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Vaccination</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-4 font-medium">Patient</th>
                <th className="text-left p-4 font-medium">Vaccine</th>
                <th className="text-left p-4 font-medium">Date Administered</th>
                <th className="text-left p-4 font-medium">Administered By</th>
                <th className="text-left p-4 font-medium">Notes</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vaccinations?.map(vaccination => (
                <tr key={vaccination.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{memberMap.get(vaccination.member_id) || 'Unknown Member'}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                      {vaccination.vaccine_name}
                    </span>
                  </td>
                  <td className="p-4 text-gray-700">{formatDate(vaccination.date_administered)}</td>
                  <td className="p-4 text-gray-700">{vaccination.administered_by}</td>
                  <td className="p-4 text-gray-600 italic">{vaccination.notes || 'N/A'}</td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600" aria-label="Edit vaccination">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600" aria-label="Delete vaccination">
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
    </div>
  );
};

export default Vaccinations;