import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { familyApi } from '../api/axios';
import type { Appointment } from '../types/family';

export { useFamilyMembers } from './family';

const fetchFamilyAppointments = async (familyId: number): Promise<Appointment[]> => {
  const { data } = await familyApi.get(`/${familyId}/appointments?sort_by=appointment_date&sort_order=asc`);
  return data;
};

export const useFamilyAppointments = () => {
  const { activeFamily } = useAuth();
  const familyId = activeFamily?.id;

  return useQuery<Appointment[], Error>({
    queryKey: ['appointments', 'family', familyId],
    queryFn: () => fetchFamilyAppointments(familyId!),
    enabled: !!familyId,
  });
};

const fetchMemberAppointments = async (familyId: number, memberId: number): Promise<Appointment[]> => {
  const url = `/${familyId}/members/${memberId}/appointments`;
  const { data } = await familyApi.get(url);
  return data;
};

export const useMemberAppointments = (memberId: number) => {
  const { activeFamily } = useAuth();
  const familyId = activeFamily?.id;

  return useQuery<Appointment[], Error>({
    queryKey: ['appointments', 'member', memberId],
    queryFn: () => fetchMemberAppointments(familyId!, memberId),
    // Query is enabled only if we have both a familyId and a memberId
    enabled: !!familyId && !!memberId,
  });
};

type AppointmentFormData = Omit<Appointment, 'id' | 'family_id' | 'created_at'>;

// CREATE 
const addAppointment = async (
  { familyId, newAppointment }: { familyId: number, newAppointment: AppointmentFormData }
): Promise<Appointment> => {
  const { data } = await familyApi.post(`/${familyId}/appointments`, newAppointment);
  return data;
};

export const useAddAppointment = () => {
  const queryClient = useQueryClient();
  const { activeFamily } = useAuth();

  return useMutation({
    mutationFn: addAppointment,
    // The `onSuccess` callback receives the returned data and the original variables
    onSuccess: (data, variables) => {
      // Invalidate the query for the ENTIRE family list.
      queryClient.invalidateQueries({ queryKey: ['appointments', 'family', activeFamily?.id] });
      
      // ALSO invalidate the query for the SPECIFIC member who got the new appointment.
      queryClient.invalidateQueries({ queryKey: ['appointments', 'member', variables.newAppointment.member_id] });
      
      // ALWAYS invalidate the dashboard stats.
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', activeFamily?.id] });
    },
  });
};

// UPDATE 
const updateAppointment = async (
  { familyId, appointmentId, updatedAppointment }: { familyId: number, appointmentId: number, updatedAppointment: Partial<AppointmentFormData> }
): Promise<Appointment> => {
  const { data } = await familyApi.patch(`/${familyId}/appointments/${appointmentId}`, updatedAppointment);
  return data;
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  const { activeFamily } = useAuth();
  
  return useMutation({
    mutationFn: updateAppointment,
    // The updated appointment data is returned as `updatedData`
    onSuccess: (updatedData) => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'family', activeFamily?.id] });
      // Invalidate the specific member's list as well
      queryClient.invalidateQueries({ queryKey: ['appointments', 'member', updatedData.member_id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', activeFamily?.id] });
    },
  });
};

// DELETE 
const deleteAppointment = async (
  { familyId, appointmentId }: { familyId: number, appointmentId: number }
): Promise<void> => {
  await familyApi.delete(`/${familyId}/appointments/${appointmentId}`);
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();
  const { activeFamily } = useAuth();

  return useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', 'family', activeFamily?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', activeFamily?.id] });
    },
  });
};