import React from 'react';
import { useSurgeries } from '../../hooks/medicalHistory';
import { HistoryListSection } from '../../components/HistoryListSection';
import { formatDate } from '../../utils/formatters';
import type { Surgery } from '../../types/family';

export const Surgeries: React.FC<{ memberId: string }> = ({ memberId }) => {
    const { data: surgeries, isLoading } = useSurgeries(memberId);

    return (
        <HistoryListSection<Surgery>
            title="Cirugías"
            data={surgeries}
            isLoading={isLoading}
            renderItem={(surgery) => (
                <div>
                    <span className="font-semibold">{surgery.name}</span>
                    <p className="text-sm text-gray-600">
                        Fecha: {formatDate(surgery.date_of_procedure)}
                    </p>
                    {surgery.surgeon_name && (
                        <p className="text-sm text-gray-600">
                            Cirujano: {surgery.surgeon_name}
                        </p>
                    )}
                    {surgery.facility_name && (
                        <p className="text-sm text-gray-600">
                            Centro médico: {surgery.facility_name}
                        </p>
                    )}
                    {surgery.notes && (
                        <p className="text-sm text-gray-500 mt-1 italic">
                            "{surgery.notes}"
                        </p>
                    )}
                </div>
            )}
        />
    );
};