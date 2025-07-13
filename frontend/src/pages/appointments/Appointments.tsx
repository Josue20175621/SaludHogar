import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Edit, Trash2, Clock, MapPin } from 'lucide-react';

import type { AppContextType } from '../../App';
import { formatDateTime } from '../../utils/formatters';

const Appointments: React.FC = () => {
  const { appointments, getMemberName } = useOutletContext<AppContextType>();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Appointments</h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Schedule Appointment</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-4 font-medium">Patient</th>
                <th className="text-left p-4 font-medium">Doctor</th>
                <th className="text-left p-4 font-medium">Specialty</th>
                <th className="text-left p-4 font-medium">Date & Time</th>
                <th className="text-left p-4 font-medium">Location</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {appointments.map(appointment => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{getMemberName(appointment.member_id)}</td>
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
                  <td className="p-4">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{appointment.location}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600" aria-label="Edit appointment">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600" aria-label="Delete appointment">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Appointments;