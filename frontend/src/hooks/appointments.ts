import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { familyApi } from '../api/axios';
import type { Appointment } from '../types/family';

export { useFamilyMembers } from './family';

const fetchAppointments = async (familyId: number): Promise<Appointment[]> => {
  const { data } = await familyApi.get(`/${familyId}/appointments?sort_by=appointment_date&sort_order=asc`);
  return data;
};

export const useAppointments = () => {
  const { activeFamily } = useAuth();
  const familyId = activeFamily?.id;

  return useQuery<Appointment[], Error>({
    queryKey: ['appointments', familyId],
    queryFn: () => fetchAppointments(familyId!),
    enabled: !!familyId,
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
    onSuccess: () => {
      // When a new appointment is added, BOTH the appointments list and
      // the dashboard stats are now out of date. We invalidate both.
      queryClient.invalidateQueries({ queryKey: ['appointments', activeFamily?.id] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', activeFamily?.id] });
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
      queryClient.invalidateQueries({ queryKey: ['appointments', activeFamily?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', activeFamily?.id] });
    },
  });
};