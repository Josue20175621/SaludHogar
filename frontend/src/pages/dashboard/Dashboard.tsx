import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, Pill, Shield } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { familyApi } from '../../api/axios';
import { useFamilyMembers } from '../../hooks/family';
import type { DashboardStats, Appointment, Medication } from '../../types/family';
import { getRelationBadgeColor } from '../family/FamilyMembers';

const fetchDashboardStats = async (familyId: number): Promise<DashboardStats> => {
    const { data } = await familyApi.get(`/${familyId}/stats`);
    return data;
};

const fetchFutureAppointments = async (familyId: number): Promise<Appointment[]> => {
    const { data } = await familyApi.get(`/${familyId}/appointments?limit=3&sort_order=asc&future_appointments=true`);
    return data;
};

const fetchActiveMedications = async (familyId: number): Promise<Medication[]> => {
    const { data } = await familyApi.get(`/${familyId}/medications?limit=3&active=true`);
    return data;
};


const Dashboard: React.FC = () => {
    const { activeFamily } = useAuth();
    const familyId = activeFamily?.id;
    const navigate = useNavigate();

    const { data: stats, isLoading: isLoadingStats } = useQuery({
        queryKey: ['dashboardStats', familyId],
        queryFn: () => fetchDashboardStats(familyId!),
        enabled: !!familyId,
    });

    const { data: recentAppointments = [], isLoading: isLoadingAppointments } = useQuery({
        queryKey: ['recentAppointments', familyId],
        queryFn: () => fetchFutureAppointments(familyId!),
        enabled: !!familyId,
    });

    const { data: activeMedications = [], isLoading: isLoadingMedications } = useQuery({
        queryKey: ['activeMedications', familyId],
        queryFn: () => fetchActiveMedications(familyId!),
        enabled: !!familyId,
    });

    const { memberMap, memberById, isLoading: isLoadingMembers } = useFamilyMembers();

    // Don't render the grid until both stats and members are loaded
    // Users can see stats immediately while appointments/medications load
    const isLoading = isLoadingStats || isLoadingMembers;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Miembros de la familia</p>
                            <p className="text-2xl font-bold text-blue-600">{stats?.member_count || 0}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Próximas citas</p>
                            <p className="text-2xl font-bold text-green-600">{stats?.upcoming_appointment_count || 0}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-green-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Medicamentos activos</p>
                            <p className="text-2xl font-bold text-purple-600">{stats?.active_medication_count || 0}</p>
                        </div>
                        <Pill className="w-8 h-8 text-purple-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Registros de vacunas</p>
                            <p className="text-2xl font-bold text-orange-600">{stats?.vaccination_record_count || 0}</p>
                        </div>
                        <Shield className="w-8 h-8 text-orange-600" />
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {/* Appointments */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Próximas citas</h3>
                        {(stats?.upcoming_appointment_count || 0) > 3 && (
                            <button
                                onClick={() => navigate('/app/appointments')}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                Ver todas ({stats?.upcoming_appointment_count})
                            </button>
                        )}
                    </div>

                    {isLoadingAppointments ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                </div>
                            ))}
                        </div>
                    ) : recentAppointments.length > 0 ? (
                        <div className="space-y-3">
                            {recentAppointments.slice(0, 3).map(appointment => {
                                const member = memberById.get(appointment.member_id);
                                return (
                                    <div
                                        key={appointment.id}
                                        className="relative flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150 cursor-pointer group"
                                    >
                                        <div className="flex-1 pr-20">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium">
                                                    {memberMap.get(appointment.member_id) || 'Cargando...'}
                                                </p>
                                                {member?.relation && (
                                                    <span
                                                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getRelationBadgeColor(member.relation)}`}
                                                    >
                                                        {member.relation}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {appointment.doctor_name} - {appointment.specialty}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {formatDateTime(appointment.appointment_date)}
                                            </p>
                                        </div>
                                        <Calendar className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 mb-1">No hay próximas citas</p>
                            <p className="text-xs text-gray-400">Las citas programadas aparecerán aquí</p>
                        </div>
                    )}
                </div>

                {/* Medications */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Medicamentos activos</h3>
                        {(stats?.active_medication_count || 0) > 3 && (
                            <button
                                onClick={() => navigate('/app/medications')}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                                Ver todos ({stats?.active_medication_count})
                            </button>
                        )}
                    </div>

                    {isLoadingMedications ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                </div>
                            ))}
                        </div>
                    ) : activeMedications.length > 0 ? (
                        <div className="space-y-3">
                            {activeMedications.slice(0, 3).map(med => {
                                const member = memberById.get(med.member_id);
                                return (
                                    <div
                                        key={med.id}
                                        className="relative flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-150 cursor-pointer group"
                                    >
                                        <div className="flex-1 pr-20">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium">
                                                    {memberMap.get(med.member_id) || 'Cargando...'}
                                                </p>
                                                {member?.relation && (
                                                    <span
                                                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getRelationBadgeColor(member.relation)}`}
                                                    >
                                                        {member.relation}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600">
                                                {med.name} - {med.dosage}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {med.frequency}
                                            </p>
                                        </div>
                                        <Pill className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Pill className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-500 mb-1">No hay medicamentos activos</p>
                            <p className="text-xs text-gray-400">Los medicamentos registrados aparecerán aquí</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;