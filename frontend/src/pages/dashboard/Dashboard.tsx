import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, Calendar, Pill, Shield } from 'lucide-react';
import type { AppContextType } from '../../App';
import { formatDateTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { familyApi } from '../../api/axios';
import type { DashboardStats, Appointment, Medication } from '../../types/family';


const Dashboard: React.FC = () => {
    const { activeFamily } = useAuth();

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
    const [activeMedications, setActiveMedications] = useState<Medication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { getMemberName } = useOutletContext<AppContextType>();

    useEffect(() => {
        if (!activeFamily) return;

        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                const [
                    statsResponse,
                    appointmentsResponse,
                    medicationsResponse
                ] = await Promise.all([
                    familyApi.get(`/${activeFamily.id}/stats`),
                    familyApi.get(`/${activeFamily.id}/appointments?limit=3&sort_by=appointment_date&sort_order=asc`),
                    familyApi.get(`/${activeFamily.id}/medications?limit=3&active=true`)
                ]);

                // Set the state for this page
                setStats(statsResponse.data);
                setRecentAppointments(appointmentsResponse.data);
                setActiveMedications(medicationsResponse.data);

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [activeFamily]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full w-full">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
        );
    }
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Family Members</p>
                            <p className="text-2xl font-bold text-blue-600">{stats?.member_count}</p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Upcoming Appointments</p>
                            <p className="text-2xl font-bold text-green-600">{stats?.upcoming_appointment_count}</p>
                        </div>
                        <Calendar className="w-8 h-8 text-green-600" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Medications</p>
                            <p className="text-2xl font-bold text-purple-600">{stats?.active_medication_count}</p>
                        </div>
                        <Pill className="w-8 h-8 text-purple-600" />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Vaccination Records</p>
                            <p className="text-2xl font-bold text-orange-600">{stats?.vaccination_record_count}</p>
                        </div>
                        <Shield className="w-8 h-8 text-orange-600" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold mb-4">Recent Appointments</h3>
                    <div className="space-y-3">
                        {recentAppointments.slice(0, 3).map(appointment => (
                            <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium">{getMemberName(appointment.member_id)}</p>
                                    <p className="text-sm text-gray-600">{appointment.doctor_name} - {appointment.specialty}</p>
                                    <p className="text-sm text-gray-500">{formatDateTime(appointment.appointment_date)}</p>
                                </div>
                                <Calendar className="w-5 h-5 text-gray-400" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-lg font-semibold mb-4">Active Medications</h3>
                    <div className="space-y-3">
                        {activeMedications.slice(0, 3).map(medication => (
                            <div key={medication.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                    <p className="font-medium">{getMemberName(medication.member_id)}</p>
                                    <p className="text-sm text-gray-600">{medication.name} - {medication.dosage}</p>
                                    <p className="text-sm text-gray-500">{medication.frequency}</p>
                                </div>
                                <Pill className="w-5 h-5 text-gray-400" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;