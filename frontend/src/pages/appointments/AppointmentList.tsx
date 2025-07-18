import React from 'react';
import type { Appointment } from '../../types/family';
import { Edit, Trash2, Clock, MapPin } from 'lucide-react';
import { useFamilyMembers } from '../../hooks/family';
import { formatDateTime } from '../../utils/formatters';

interface AppointmentListProps {
  appointments: Appointment[];
  isLoading: boolean;
}

const AppointmentList: React.FC<AppointmentListProps> = ({ appointments, isLoading }) => {
  const { memberMap } = useFamilyMembers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return <p className="text-center text-gray-500 py-8">No se encontraron citas.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left p-4 font-medium">Paciente</th>
            <th className="text-left p-4 font-medium">Doctor</th>
            <th className="text-left p-4 font-medium">Especialidad</th>
            <th className="text-left p-4 font-medium">Fecha y Hora</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {appointments.map(appointment => (
            <tr key={appointment.id} className="hover:bg-gray-50">
              <td className="p-4 font-medium text-gray-800">
                {memberMap.get(appointment.member_id) || 'Desconocido'}
              </td>
              <td className="p-4">{appointment.doctor_name}</td>
              <td className="p-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {appointment.specialty}
                </span>
              </td>
              <td className="p-4">
                <div className="flex items-center space-x-2 text-gray-700">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{formatDateTime(appointment.appointment_date)}</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AppointmentList;