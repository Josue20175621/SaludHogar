import React from 'react';
import { useFamilyHistoryConditions } from '../../hooks/medicalHistory';
import { HistoryListSection } from '../../components/HistoryListSection';
import { type FamilyHistoryCondition as FamilyHistoryConditionType } from '../../types/family';

export const FamilyHistoryConditions: React.FC = () => {
    const { data: conditions, isLoading } = useFamilyHistoryConditions();

    return (
        <HistoryListSection
            title="Antecedentes Familiares"
            data={conditions}
            isLoading={isLoading}
            renderItem={(condition: FamilyHistoryConditionType) => (
                <div>
                    <span className="font-semibold">{condition.condition_name}</span>
                    <p className="text-sm text-gray-600">Familiar: {condition.relative}</p>
                    {condition.notes && (
                        <p className="text-sm text-gray-600">Notas: {condition.notes}</p>
                    )}
                </div>
            )}
        />
    );
};