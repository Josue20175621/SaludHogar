import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { familyApi } from '../api/axios';
import type { Medication } from '../types/family';

const fetchMedications = async (familyId: number): Promise<Medication[]> => {
  const { data } = await familyApi.get(`/${familyId}/medications`);
  return data;
};

export const useMedications = () => {
  const { activeFamily } = useAuth();
  const familyId = activeFamily?.id;

  return useQuery<Medication[], Error>({
    queryKey: ['medications', familyId],
    queryFn: () => fetchMedications(familyId!),
    enabled: !!familyId,
  });
};

type MedicationFormData = Omit<Medication, 'id' | 'family_id' | 'created_at'>;

// CREATE
const addMedication = async (
  { familyId, newMedication }: { familyId: number, newMedication: MedicationFormData }
): Promise<Medication> => {
  const { data } = await familyApi.post(`/${familyId}/medications`, newMedication);
  return data;
};

export const useAddMedication = () => {
  const queryClient = useQueryClient();
  const { activeFamily } = useAuth();

  return useMutation({
    mutationFn: addMedication,
    onSuccess: () => {
      // Invalidate both the main list and the dashboard stats
      queryClient.invalidateQueries({ queryKey: ['medications', activeFamily?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', activeFamily?.id] });
    },
  });
};

// UPDATE
const updateMedication = async (
  { familyId, medicationId, updatedMedication }: { familyId: number, medicationId: number, updatedMedication: Partial<MedicationFormData> }
): Promise<Medication> => {
  const { data } = await familyApi.patch(`/${familyId}/medications/${medicationId}`, updatedMedication);
  return data;
};

export const useUpdateMedication = () => {
  const queryClient = useQueryClient();
  const { activeFamily } = useAuth();
  
  return useMutation({
    mutationFn: updateMedication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', activeFamily?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', activeFamily?.id] });
    },
  });
};

// DELETE
const deleteMedication = async (
  { familyId, medicationId }: { familyId: number, medicationId: number }
): Promise<void> => {
  await familyApi.delete(`/${familyId}/medications/${medicationId}`);
};

export const useDeleteMedication = () => {
  const queryClient = useQueryClient();
  const { activeFamily } = useAuth();

  return useMutation({
    mutationFn: deleteMedication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medications', activeFamily?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', activeFamily?.id] });
    },
  });
};