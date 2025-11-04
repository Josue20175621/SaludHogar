import React from 'react';
import { useMemberMedications } from '../../hooks/medications';
import MedicationList from '../medications/MedicationList';

interface MemberMedicationsProps {
  memberId: string;
}

export const MemberMedications: React.FC<MemberMedicationsProps> = ({ memberId }) => {
  // Fetch Medications specifically for this member
  const { data: memberMedications, isLoading } = useMemberMedications(parseInt(memberId));

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <header className="p-4 border-b">
         <h3 className="text-lg font-semibold">Medicamentos</h3>
      </header>
      <MedicationList
        medications={memberMedications || []}
        isLoading={isLoading}
      />
    </div>
  );
};