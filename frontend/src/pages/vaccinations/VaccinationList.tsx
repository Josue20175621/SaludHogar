import React from 'react';
import type { Vaccination } from '../../types/family';
import { useFamilyMembers } from '../../hooks/family';
import { formatDate } from '../../utils/formatters';

interface VaccinationListProps {
  vaccinations: Vaccination[];
  isLoading: boolean;
}

const VaccinationList: React.FC<VaccinationListProps> = ({ vaccinations, isLoading }) => {
  const { memberMap, isLoading: isLoadingMembers } = useFamilyMembers();

  const effectiveIsLoading = isLoading || isLoadingMembers;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {effectiveIsLoading ? (
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-orange-600 rounded-full animate-spin"></div>
        </div>
      ) : vaccinations.length === 0 ? (
        <p className="text-center text-gray-500 py-8">No se encontraron registros de vacunación.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-4 font-medium whitespace-nowrap">Paciente</th>
                <th className="text-left p-4 font-medium whitespace-nowrap">Vacuna</th>
                <th className="text-left p-4 font-medium whitespace-nowrap">Fecha de administración</th>
                <th className="text-left p-4 font-medium whitespace-nowrap">Administrada por</th>
                <th className="text-left p-4 font-medium">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {vaccinations.map(vaccination => (
                <tr key={vaccination.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800 whitespace-nowrap">
                    {memberMap.get(vaccination.member_id) || 'Desconocido'}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                      {vaccination.vaccine_name}
                    </span>
                  </td>
                  <td className="p-4 text-gray-700 whitespace-nowrap">
                    {formatDate(vaccination.date_administered)}
                  </td>
                  <td className="p-4 text-gray-700 whitespace-nowrap">
                    {vaccination.administered_by || 'N/D'}
                  </td>
                  <td className="p-4 text-gray-600 italic max-w-xs truncate" title={vaccination.notes || ''}>
                    {vaccination.notes || 'N/D'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VaccinationList;