import React from 'react';
import { useConditions } from '../../hooks/medicalHistory';
import { HistoryListSection } from '../../components/HistoryListSection';
import { formatDate } from '../../utils/formatters';
import type { Condition } from '../../types/family';

export const Conditions: React.FC<{ memberId: string }> = ({ memberId }) => {
    const { data: conditions, isLoading } = useConditions(memberId);

    return (
        <HistoryListSection<Condition>
            title="Condiciones"
            data={conditions}
            isLoading={isLoading}
            renderItem={(condition) => (
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold">{condition.name}</span>
                        {condition.is_active && (
                            <span className="px-2 py-0.5 text-xs font-medium text-white bg-blue-600 rounded-full">
                                Activa
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600">
                        Diagnosticada: {condition.date_diagnosed ? formatDate(condition.date_diagnosed) : 'N/D'}
                    </p>
                    {condition.notes && (
                        <p className="text-sm text-gray-500 mt-1 italic">
                            "{condition.notes}"
                        </p>
                    )}
                </div>
            )}
        />
    );
};