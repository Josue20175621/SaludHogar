import React from 'react';
import { useMemberVaccinations } from '../../hooks/vaccinations';
import VaccinationList from '../vaccinations/VaccinationList';

interface MemberVaccinationsProps {
  memberId: string;
}

export const MemberVaccinations: React.FC<MemberVaccinationsProps> = ({ memberId }) => {
  // Fetch vaccinations specifically for this member
  const { data: memberVaccinations, isLoading } = useMemberVaccinations(parseInt(memberId));

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <header className="p-4 border-b">
         <h3 className="text-lg font-semibold">Vacunas</h3>
      </header>
      <VaccinationList
        vaccinations={memberVaccinations || []}
        isLoading={isLoading}
      />
    </div>
  );
};
