import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Calendar, Pill, Shield, ArrowRight } from 'lucide-react';
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

    const isLoading = isLoadingStats || isLoadingMembers;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full min-h-[400px]">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-8">
            {/* Welcome Section - Desktop Only */}
            <div className="hidden md:block">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel de Control</h1>
                <p className="text-gray-600">Resumen de la salud familiar</p>
            </div>

            {/* Stats Grid - Responsive */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                <div onClick={() => navigate('/app/members')}
                    className="bg-gradient-to-br from-blue-50 to-white p-4 sm:p-6 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Miembros</p>
                            <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats?.member_count || 0}</p>
                        </div>
                    </div>
                </div>

                <div onClick={() => navigate('/app/appointments')}
                    className="bg-gradient-to-br from-green-50 to-white p-4 sm:p-6 rounded-xl shadow-sm border border-green-100 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Próximas citas</p>
                            <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats?.upcoming_appointment_count || 0}</p>
                            {(stats?.upcoming_appointment_count || 0) > 3 && (
                                <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer">
                                    Ver todas
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div onClick={() => navigate('/app/medications')}
                    className="bg-gradient-to-br from-purple-50 to-white p-4 sm:p-6 rounded-xl shadow-sm border border-purple-100 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Pill className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Medicamentos activos</p>
                            <p className="text-2xl sm:text-3xl font-bold text-purple-600">{stats?.active_medication_count || 0}</p>
                            {(stats?.active_medication_count || 0) > 3 && (
                                <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors cursor-pointer">
                                    Ver todos
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div onClick={() => navigate('/app/vaccinations')}
                    className="bg-gradient-to-br from-orange-50 to-white p-4 sm:p-6 rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                    <div className="flex flex-col space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                            </div>
                        </div>
                        <div>
                            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Vacunas registradas</p>
                            <p className="text-2xl sm:text-3xl font-bold text-orange-600">{stats?.vaccination_record_count || 0}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
                {/* Appointments */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Próximas citas</h3>
                    </div>

                    {isLoadingAppointments ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
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
                                        className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-150 cursor-pointer border border-transparent hover:border-gray-200"
                                    >
                                        <div className="p-2 bg-green-100 rounded-lg shrink-0">
                                            <Calendar className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <p className="font-semibold text-gray-900 text-sm sm:text-base">
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
                                            <p className="text-sm text-gray-700 mb-1">
                                                {appointment.doctor_name} - {appointment.specialty}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-500">
                                                {formatDateTime(appointment.appointment_date)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="inline-flex p-2 bg-green-100 rounded-lg mb-3">
                                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-700 mb-1">No hay próximas citas</p>
                            <p className="text-xs text-gray-500 mb-4">Las citas programadas aparecerán aquí</p>
                            <button
                                onClick={() => navigate('/app/appointments')}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                Programar Cita
                            </button>
                        </div>
                    )}
                </div>

                {/* Medications */}
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Medicamentos activos</h3>
                    </div>

                    {isLoadingMedications ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
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
                                        className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-150 cursor-pointer border border-transparent hover:border-gray-200"
                                    >
                                        <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                                            <Pill className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <p className="font-semibold text-gray-900 text-sm sm:text-base">
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
                                            <p className="text-sm text-gray-700 mb-1">
                                                {med.name} - {med.dosage}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-500">
                                                {med.frequency}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <div className="inline-flex p-2 bg-purple-100 rounded-lg mb-3">
                                <Pill className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-700 mb-1">No hay medicamentos activos</p>
                            <p className="text-xs text-gray-500 mb-4">Los medicamentos registrados aparecerán aquí</p>
                            <button
                                onClick={() => navigate('/app/medications')}
                                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                            >
                                Agregar Medicamento
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;