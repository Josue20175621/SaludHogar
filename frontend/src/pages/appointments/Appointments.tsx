import React, { useState, useMemo } from 'react';
import { Calendar, Stethoscope, MapPin} from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../../context/AuthContext';
import {
  useFamilyAppointments,
  useFamilyMembers,
} from '../../hooks/appointments';
import { type Appointment } from '../../types/family';

const formatAppointmentDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const isToday = date.toDateString() === today.toDateString();
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Hoy a las ${time}`;
  if (isTomorrow) return `Mañana a las ${time}`;

  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};


const Appointments: React.FC = () => {
  const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:8000`;
  const { activeFamily } = useAuth();
  const { data: allAppointments, isLoading: isLoadingAppointments } = useFamilyAppointments();
  const { memberById: memberMap, isLoading: isLoadingMembers } = useFamilyMembers();

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
            className={`w-full text-center px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${viewMode === 'upcoming' ? 'bg-white text-green-700 shadow' : 'text-gray-600 hover:bg-gray-300'
              }`}
          >
            Próximas
          </button>
          <button
            onClick={() => setViewMode('past')}
            className={`w-full text-center px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${viewMode === 'past' ? 'bg-white text-green-700 shadow' : 'text-gray-600 hover:bg-gray-300'
              }`}
          >
            Anteriores
          </button>
        </div>
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
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ))
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-gray-700">{viewMode === 'upcoming' ? 'Todo despejado' : 'Sin historial'}</h3>
          <p className="text-gray-500 mt-2">{viewMode === 'upcoming' ? 'No hay próximas citas programadas.' : 'No se encontraron citas anteriores.'}</p>
        </div>
      )}
    </div>
  );
};

export default Appointments;