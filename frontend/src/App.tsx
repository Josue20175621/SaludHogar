import React, { useState, useCallback, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

import type { FamilyMember, Appointment, Medication, Vaccination } from './types/family';

import { familyApi } from './api/axios';
import { useAuth } from './context/AuthContext';

import Layout from './components/Layout';

export interface AppContextType {
  familyMembers: FamilyMember[];
  appointments: Appointment[];
  medications: Medication[];
  vaccinations: Vaccination[];
  getMemberName: (memberId: number) => string;

  isLoading: boolean;
  error: string | null;
}

const App: React.FC = () => {
  const { activeFamily } = useAuth(); // Get the active family
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!activeFamily) return;

      setIsLoading(true);
      setError(null);

      try {
        // Use Promise.all to run all API calls in parallel for speed
        const [
          membersResponse,
          appointmentsResponse,
          medicationsResponse,
          vaccinationsResponse
        ] = await Promise.all([
          familyApi.get(`/${activeFamily.id}/members`),
          familyApi.get(`/${activeFamily.id}/appointments`),
          familyApi.get(`${activeFamily.id}/medications`),
          familyApi.get(`${activeFamily.id}/vaccinations`)
        ]);

        // 3. Update state with the data from the API
        setFamilyMembers(membersResponse.data);
        setAppointments(appointmentsResponse.data);
        setMedications(medicationsResponse.data);
        setVaccinations(vaccinationsResponse.data);

      } catch (err: any) {
        console.error("Failed to fetch application data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [activeFamily]);

  const getMemberName = useCallback((memberId: number) => {
    const member = familyMembers.find(m => m.id === memberId);
    return member ? `${member.first_name} ${member.last_name}` : 'Unknown';
  }, [familyMembers]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
  }

  const appContext: AppContextType = {
    familyMembers,
    appointments,
    medications,
    vaccinations,
    getMemberName,
    isLoading,
    error,
  };

  return (
    // The Layout component now contains the <Outlet>
    // We pass our data down to the child routes using the `context` prop on Outlet
    <Layout>
      <Outlet context={appContext} />
    </Layout>
  );
};

export default App;