import React from 'react';
import { useHospitalizations } from '../../hooks/medicalHistory';
import { HistoryListSection } from '../../components/HistoryListSection';
import { formatDate } from '../../utils/formatters';
import type { Hospitalization } from '../../types/family';

export const Hospitalizations: React.FC<{ memberId: string }> = ({ memberId }) => {
    const { data: hospitalizations, isLoading } = useHospitalizations(memberId);

    return (
        <HistoryListSection<Hospitalization>
            title="Hospitalizaciones"
            data={hospitalizations}
            isLoading={isLoading}
            renderItem={(hospitalization) => (
                <div>
                    <span className="font-semibold">{hospitalization.reason}</span>
                    <p className="text-sm text-gray-600">
                        Ingreso: {formatDate(hospitalization.admission_date)}
                        {hospitalization.discharge_date && ` - Alta: ${formatDate(hospitalization.discharge_date)}`}
                    </p>
                    {hospitalization.facility_name && (
                        <p className="text-sm text-gray-600">
                            Centro médico: {hospitalization.facility_name}
                        </p>
                    )}
                    {hospitalization.notes && (
                        <p className="text-sm text-gray-500 mt-1 italic">
                            "{hospitalization.notes}"
                        </p>
                    )}
                </div>
            )}
        />
    );
};