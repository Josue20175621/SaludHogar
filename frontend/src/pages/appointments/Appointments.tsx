import type { FormEvent } from 'react'
import React, { useState } from 'react';
import type { Appointment, FamilyMember } from '../../types/family';
import { Plus, Edit, Trash2, Clock } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import {
  useAppointments,
  useAddAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  useFamilyMembers,
} from '../../hooks/appointments';

const AppointmentsPage: React.FC = () => {
  const { activeFamily } = useAuth();
  const { data: appointments, isLoading: isLoadingAppointments } = useAppointments();
  const { members: familyMembers, memberMap, isLoading: isLoadingMembers } = useFamilyMembers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const addAppointmentMutation = useAddAppointment();
  const updateAppointmentMutation = useUpdateAppointment();
  const deleteAppointmentMutation = useDeleteAppointment();

  const handleOpenAddModal = () => {
    setEditingAppointment(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (formData: any) => {
    if (!activeFamily) return;

    if (editingAppointment) {
      updateAppointmentMutation.mutate(
        { familyId: activeFamily.id, appointmentId: editingAppointment.id, updatedAppointment: formData },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      addAppointmentMutation.mutate(
        { familyId: activeFamily.id, newAppointment: formData },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const handleDeleteAppointment = (appointmentId: number) => {
    if (!activeFamily) return;
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      deleteAppointmentMutation.mutate({ familyId: activeFamily.id, appointmentId });
    }
  };

  if (isLoadingAppointments || isLoadingMembers) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Appointments</h2>
        <button
          onClick={handleOpenAddModal}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
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
                <th className="text-left p-4 font-medium">Date & Time</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {appointments?.map(appointment => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{memberMap.get(appointment.member_id) || 'Unknown'}</td>
                  <td className="p-4">{appointment.doctor_name}</td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{formatDateTime(appointment.appointment_date)}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex space-x-1">
                      <button onClick={() => handleOpenEditModal(appointment)} className="p-2 text-gray-400 hover:text-cyan-600 rounded-full hover:bg-gray-100">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteAppointment(appointment.id)} disabled={deleteAppointmentMutation.isPending && deleteAppointmentMutation.variables?.appointmentId === appointment.id} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100 disabled:opacity-50">
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

      {isModalOpen && (
        <AppointmentFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={editingAppointment}
          familyMembers={familyMembers || []}
          isLoading={addAppointmentMutation.isPending || updateAppointmentMutation.isPending}
        />
      )}
    </div>
  );
};

interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData: Appointment | null;
  familyMembers: FamilyMember[];
  isLoading: boolean;
}

const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, familyMembers, isLoading }) => {
  const [formData, setFormData] = useState({
    member_id: initialData?.member_id || '',
    doctor_name: initialData?.doctor_name || '',
    appointment_date: initialData?.appointment_date ? initialData.appointment_date.substring(0, 16) : '', // Format for datetime-local
    specialty: initialData?.specialty || '',
    location: initialData?.location || '',
    notes: initialData?.notes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Convert member_id back to a number before submitting
    onSubmit({ ...formData, member_id: Number(formData.member_id) });
  };

  if (!isOpen) return null;

  // The same style as member input with a different color
  const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{initialData ? 'Edit Appointment' : 'Schedule New Appointment'}</h2>
        {/* Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="member_id" className="block text-sm font-medium text-gray-700">Patient</label>
            <select
              name="member_id"
              id="member_id"
              value={formData.member_id}
              onChange={handleChange}
              required
              className={inputStyle}
            >
              <option value="" disabled>Select a family member...</option>
              {familyMembers.map(member => (
                <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="doctor_name" className="block text-sm font-medium text-gray-700">Doctor Name</label>
            <input type="text" name="doctor_name" id="doctor_name" value={formData.doctor_name} onChange={handleChange} required className={inputStyle} />
          </div>

          <div>
            <label htmlFor="appointment_date" className="block text-sm font-medium text-gray-700">Date & Time </label>
            <input type="datetime-local" name="appointment_date" id="appointment_date" value={formData.appointment_date} onChange={handleChange} required className={inputStyle} />
          </div>

          <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">Specialty</label>
            <input type="text" name="specialty" id="specialty" value={formData.specialty} onChange={handleChange} className={inputStyle} />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
            <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className={inputStyle} />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputStyle}></textarea>
          </div>

          <div className="pt-6 flex justify-end space-x-4">
            <button type="button" onClick={onClose} disabled={isLoading} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center transition-colors">
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
              {initialData ? 'Save Changes' : 'Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default AppointmentsPage;