import React from 'react';
import { useAllergies } from '../../hooks/medicalHistory';
import { HistoryListSection } from '../../components/HistoryListSection';

export const Allergies: React.FC<{ memberId: string }> = ({ memberId }) => {
    const { data: allergies, isLoading } = useAllergies(memberId);

    return (
        <HistoryListSection
            title="Alergias"
            data={allergies}
            isLoading={isLoading}
            renderItem={(allergy) => (
                <div>
                    <span className={`font-semibold ${allergy.is_severe ? 'text-red-600' : ''}`}>{allergy.name}</span>
                    <p className="text-sm text-gray-600">Categoría: {allergy.category}</p>
                    <p className="text-sm text-gray-600">Reacción: {allergy.reaction || 'N/D'}</p>
                </div>
            )}
        />
    );
};