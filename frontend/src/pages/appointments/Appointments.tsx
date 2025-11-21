import type { FormEvent } from 'react'
import React, { useState, useMemo } from 'react';
import { Plus, Calendar, Stethoscope, MapPin, Pencil, Trash2 } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import {
  useFamilyAppointments,
  useAddAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  useFamilyMembers,
} from '../../hooks/appointments';
import type { Appointment, FamilyMember } from '../../types/family';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';

const formatAppointmentDate = (dateString: string): string => {
  /*
    Si la fecha de la cita es hoy: "Hoy a las 6:55 p. m."
    Mañana: "Mañana a las 9:30 a. m."
    Futuro: "sábado, 21 de diciembre de 2025, 11:00 a. m."
  */
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString('es-DO', { 
    hour: 'numeric',
    minute: '2-digit', 
    hour12: true 
  });

  if (isToday) return `Hoy a las ${time}`;
  if (isTomorrow) return `Mañana a las ${time}`;

  return date.toLocaleDateString('es-DO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};


const Appointments: React.FC = () => {
  const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:8000`;
  const { activeFamily } = useAuth();
  const { data: allAppointments, isLoading: isLoadingAppointments } = useFamilyAppointments();
  const { members: familyMembers, memberById: memberMap, isLoading: isLoadingMembers } = useFamilyMembers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

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

  const handleOpenDeleteModal = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setAppointmentToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleFormSubmit = (formData: any) => {
    if (!activeFamily) return;

    const dataToSend = { ...formData };

    if (dataToSend.appointment_date) {
      const localDate = new Date(dataToSend.appointment_date);
      dataToSend.appointment_date = localDate.toISOString();
    }

    if (editingAppointment) {
      updateAppointmentMutation.mutate(
        { familyId: activeFamily.id, appointmentId: editingAppointment.id, updatedAppointment: dataToSend },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      addAppointmentMutation.mutate(
        { familyId: activeFamily.id, newAppointment: dataToSend },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!activeFamily || !appointmentToDelete) return;

    deleteAppointmentMutation.mutate(
      { familyId: activeFamily.id, appointmentId: appointmentToDelete.id },
      {
        onSuccess: () => {
          handleCloseDeleteModal();
        },
      }
    );
  };

  const [viewMode, setViewMode] = useState<'upcoming' | 'past'>('upcoming');

  // Memoize filtering to avoid re-calculating on every render
  const { upcomingAppointments, pastAppointments } = useMemo(() => {
    const now = new Date();
    const upcoming: Appointment[] = [];
    const past: Appointment[] = [];

    (allAppointments || []).forEach(appointment => {
      if (parseISO(appointment.appointment_date) >= now) {
        upcoming.push(appointment);
      } else {
        past.push(appointment);
      }
    });

    // Sort past appointments from most recent to oldest
    past.sort((a, b) => parseISO(b.appointment_date).getTime() - parseISO(a.appointment_date).getTime());

    return { upcomingAppointments: upcoming, pastAppointments: past };
  }, [allAppointments]);

  // Conditionally group appointments based on viewMode
  const { groupedAppointments, groupOrder } = useMemo(() => {
    if (viewMode === 'upcoming') {
      const grouped = upcomingAppointments.reduce((acc, appointment) => {
        const date = parseISO(appointment.appointment_date);
        let groupKey: string = 'Próximamente';
        if (isToday(date)) groupKey = 'Hoy';
        else if (isTomorrow(date)) groupKey = 'Mañana';

        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(appointment);
        return acc;
      }, {} as Record<string, Appointment[]>);
      return { groupedAppointments: grouped, groupOrder: ['Hoy', 'Mañana', 'Próximamente'] };
    } else { // 'past' view
      const grouped = pastAppointments.reduce((acc, appointment) => {
        const date = parseISO(appointment.appointment_date);
        // Group by month and year, e.g., "Octubre 2025"
        const groupKey = format(date, 'MMMM yyyy', { locale: es });

        if (!acc[groupKey]) acc[groupKey] = [];
        acc[groupKey].push(appointment);
        return acc;
      }, {} as Record<string, Appointment[]>);
      return { groupedAppointments: grouped, groupOrder: Object.keys(grouped) };
    }
  }, [viewMode, upcomingAppointments, pastAppointments]);

  if (isLoadingAppointments || isLoadingMembers) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const appointmentsToDisplay = viewMode === 'upcoming' ? upcomingAppointments : pastAppointments;

  return (
    <div className="space-y-8 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Citas Médicas</h2>
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button
            onClick={() => setViewMode('upcoming')}
            className={`w-full text-center px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 cursor-pointer ${viewMode === 'upcoming' ? 'bg-white text-green-700 shadow' : 'text-gray-600 hover:bg-gray-300'
              }`}
          >
            Próximas
          </button>
          <button
            onClick={() => setViewMode('past')}
            className={`w-full text-center px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 cursor-pointer ${viewMode === 'past' ? 'bg-white text-green-700 shadow' : 'text-gray-600 hover:bg-gray-300'
              }`}
          >
            Anteriores
          </button>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-green-600 text-white rounded-full p-3 sm:rounded-lg sm:px-4 sm:py-2 flex items-center sm:space-x-2 transition-colors hover:bg-green-700 fixed bottom-6 right-6 sm:static shadow-lg sm:shadow-none z-30 sm:z-auto"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline font-semibold">Programar cita</span>
        </button>
      </div>

      {appointmentsToDisplay.length > 0 ? (
        groupOrder.map(group => (
          groupedAppointments[group] && (
            <div key={group}>
              <h3 className="text-xl font-semibold text-gray-700 mb-4 capitalize">{group}</h3>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {groupedAppointments[group].map(appointment => {
                  // Get the full member object for this appointment.
                  const member = memberMap.get(appointment.member_id);
                  if (!member) return null;
                  const initials = `${member.first_name?.[0] ?? ''}${member.last_name?.[0] ?? ''}`.toUpperCase() || '?';

                  return (
                    <div key={appointment.id} className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 flex flex-col ${viewMode === 'past' ? 'opacity-70 grayscale' : 'hover:-translate-y-1'}`}>
                      <div className="bg-gradient-to-br from-green-50 to-white p-4 rounded-t-xl border-b border-green-100">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full mr-4 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                            <img
                              key={member.id}
                              src={`${API_URL}/families/${activeFamily?.id}/members/${member.id}/photo`}
                              alt={`${member.first_name} ${member.last_name}`}
                              loading="lazy"
                              className="h-full w-full object-cover select-none"
                              onError={(e) => {
                                const target = e.currentTarget;
                                target.src = 'data:image/svg+xml;charset=UTF-8,' +
                                  encodeURIComponent(`
                                    <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#262626"/><stop offset="100%" stop-color="#1f2937"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="160" fill="#9ca3af" font-family="system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif" letter-spacing="2">${initials}</text></svg>
                                  `);
                              }}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-lg text-green-900">{`${member.first_name} ${member.last_name}`}</p>
                            <p className="text-sm font-medium text-green-700">{appointment.specialty}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 space-y-4 flex-grow">
                        {/* Key Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">

                          {/* Date and Time */}
                          <div className="space-y-1 sm:col-span-2">
                            <div className="flex items-center text-xs text-gray-500 font-semibold uppercase">
                              <Calendar className="w-4 h-4 mr-1.5 text-green-600" />
                              <span>Fecha y Hora</span>
                            </div>
                            <p className="text-base font-bold text-green-900 pl-6">
                              {formatAppointmentDate(appointment.appointment_date)}
                            </p>
                          </div>

                          {/* Doctor */}
                          <div className="space-y-1">
                            <div className="flex items-center text-xs text-gray-500 font-semibold uppercase">
                              <Stethoscope className="w-4 h-4 mr-1.5 text-green-600" />
                              <span>Profesional</span>
                            </div>
                            <p className="text-base font-bold text-green-900 pl-6">{appointment.doctor_name}</p>
                          </div>

                          {/* Location */}
                          <div className="space-y-1">
                            <div className="flex items-center text-xs text-gray-500 font-semibold uppercase">
                              <MapPin className="w-4 h-4 mr-1.5 text-green-600" />
                              <span>Ubicación</span>
                            </div>
                            <p className="text-base font-bold text-green-900 pl-6">{appointment.location}</p>
                          </div>
                        </div>

                        {/* Notes Section */}
                        {appointment.notes && (
                          <>
                            <hr className="border-gray-100" />
                            <div className="border-l-4 border-green-200 bg-green-50/50 p-3 rounded-r-md">
                              <p className="text-sm text-green-900 italic leading-relaxed">{appointment.notes}</p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="border-t border-gray-100 p-2 flex justify-end space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(appointment)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors duration-200 cursor-pointer"
                          aria-label="Editar cita"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDeleteModal(appointment)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200 cursor-pointer"
                          aria-label="Eliminar cita"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )
        ))
      ) : (
        <div className="text-center py-12">
          <div className="inline-flex p-2 bg-green-100 rounded-lg mb-3">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
          </div>

          <p className="text-sm font-medium text-gray-700 mb-1">
            {viewMode === 'upcoming' ? 'Todo despejado' : 'Sin historial'}
          </p>

          <p className="text-xs text-gray-500 mb-4">
            {viewMode === 'upcoming' ? 'No tienes próximas citas programadas.' : 'No se encontraron citas anteriores.'}
          </p>
        </div>
      )}

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

      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          isLoading={deleteAppointmentMutation.isPending}
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
    appointment_date: initialData?.appointment_date ? initialData.appointment_date.substring(0, 16) : '', // Formato para datetime-local
    specialty: initialData?.specialty || '',
    location: initialData?.location || '',
    notes: initialData?.notes || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Convertir member_id a número antes de enviar
    onSubmit({ ...formData, member_id: Number(formData.member_id) });
  };

  if (!isOpen) return null;

  // El mismo estilo que el campo de miembro pero con un color diferente
  const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">{initialData ? 'Editar Cita' : 'Programar Nueva Cita'}</h2>
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="member_id" className="block text-sm font-medium text-gray-700">Paciente</label>
            <select
              name="member_id"
              id="member_id"
              value={formData.member_id}
              onChange={handleChange}
              required
              disabled={!!initialData}
              className={`${inputStyle} ${initialData ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            >
              <option value="" disabled>Selecciona un miembro de la familia...</option>
              {familyMembers.map(member => (
                <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="doctor_name" className="block text-sm font-medium text-gray-700">Nombre del Doctor</label>
            <input type="text" name="doctor_name" id="doctor_name" value={formData.doctor_name} onChange={handleChange} required className={inputStyle} />
          </div>

          <div>
            <label htmlFor="appointment_date" className="block text-sm font-medium text-gray-700">Fecha y Hora</label>
            <input type="datetime-local" name="appointment_date" id="appointment_date" value={formData.appointment_date} onChange={handleChange} required className={inputStyle} />
          </div>

          <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">Especialidad</label>
            <input type="text" name="specialty" id="specialty" value={formData.specialty} onChange={handleChange} className={inputStyle} />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Ubicación</label>
            <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className={inputStyle} />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notas</label>
            <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className={inputStyle}></textarea>
          </div>

          <div className="pt-6 flex justify-end space-x-4">
            <button type="button" onClick={onClose} disabled={isLoading} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors cursor-pointer">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center transition-colors cursor-pointer">
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
              {initialData ? 'Guardar Cambios' : 'Programar Cita'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


export default Appointments;