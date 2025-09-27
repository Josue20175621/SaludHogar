import React from 'react';
import { AlertCircle } from 'lucide-react';
import { formatDate } from '../utils/formatters';
import type { Medication } from '../types/family';

interface MedicationCardReadOnlyProps {
  medication: Medication;
  memberName: string;
}

export const MedicationCardReadOnly: React.FC<MedicationCardReadOnlyProps> = ({ medication, memberName }) => {
  const isActive = () => {
    if (!medication.start_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(medication.start_date);
    if (startDate > today) return false;
    if (medication.end_date) {
      const endDate = new Date(medication.end_date);
      return endDate >= today;
    }
    return true;
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      {/* Header Section */}
      <div className="pb-4 border-b">
        <h3 className="text-lg font-bold text-gray-900">{medication.name}</h3>
        <p className="text-sm text-gray-600">{memberName}</p>
      </div>

      {/* Details Section */}
      <div className="space-y-3 text-sm mt-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-500">Dosis:</span>
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded font-medium">{medication.dosage}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-500">Frecuencia:</span>
          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">{medication.frequency}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-500">Fecha de inicio:</span>
          <span className="text-gray-700">{medication.start_date ? formatDate(medication.start_date) : 'N/A'}</span>
        </div>
      </div>

      {/* Notes and Status Section */}
      {(medication.notes || isActive()) && (
        <div className="mt-4 pt-4 border-t">
          {isActive() && (
            <div className="flex items-center space-x-2 text-green-600 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-semibold">Activo</span>
            </div>
          )}
          {medication.notes && (
            <p className="text-sm text-gray-600 italic">"{medication.notes}"</p>
          )}
        </div>
      )}
    </div>
  );
};