import React from 'react';
import type { Medication } from '../../types/family';
import { useFamilyMembers } from '../../hooks/family';
import { MedicationCardReadOnly } from '../../components/MedicationCard'; // We'll use a read-only card

interface MedicationListProps {
  medications: Medication[];
  isLoading: boolean;
}

const MedicationList: React.FC<MedicationListProps> = ({ medications, isLoading }) => {
  const { memberMap, isLoading: isLoadingMembers } = useFamilyMembers();

  const effectiveIsLoading = isLoading || isLoadingMembers;

  if (effectiveIsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (medications.length === 0) {
    return <p className="text-center text-gray-500 py-8 col-span-1 lg:col-span-2">No se encontraron registros de medicamentos.</p>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {medications.map(medication => (
        <MedicationCardReadOnly
          key={medication.id}
          medication={medication}
          memberName={memberMap.get(medication.member_id) || 'Unknown'}
        />
      ))}
    </div>
  );
};

export default MedicationList;