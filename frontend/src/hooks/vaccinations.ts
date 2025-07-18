import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { familyApi } from '../api/axios';
import type { Vaccination } from '../types/family';

const fetchVaccinations = async (familyId: number): Promise<Vaccination[]> => {
  const { data } = await familyApi.get(`/${familyId}/vaccinations`);
  return data;
};

export const useVaccinations = () => {
  const { activeFamily } = useAuth();
  const familyId = activeFamily?.id;

  return useQuery<Vaccination[], Error>({
    queryKey: ['vaccinations', familyId],
    queryFn: () => fetchVaccinations(familyId!),
    enabled: !!familyId,
  });
};

// Fetch member medication
const fetchMemberVaccinations = async (familyId: number, memberId: number): Promise<Vaccination[]> => {
  // Uses the new, more RESTful URL
  const url = `/${familyId}/members/${memberId}/vaccinations`;
  const { data } = await familyApi.get(url);
  return data;
};

// Hook for the tab inside MemberDetail
export const useMemberVaccinations = (memberId: number) => {
  const { activeFamily } = useAuth();
  const familyId = activeFamily?.id;

  return useQuery<Vaccination[], Error>({
    queryKey: ['vaccinations', 'member', memberId],
    queryFn: () => fetchMemberVaccinations(familyId!, memberId),
    enabled: !!familyId && !!memberId,
  });
};

type VaccinationFormData = Omit<Vaccination, 'id' | 'family_id' | 'created_at'>;

// CREATE
const addVaccination = async (
  { familyId, newVaccination }: { familyId: number, newVaccination: VaccinationFormData }
): Promise<Vaccination> => {
  const { data } = await familyApi.post(`/${familyId}/vaccinations`, newVaccination);
  return data;
};

export const useAddVaccination = () => {
  const queryClient = useQueryClient();
  const { activeFamily } = useAuth();

  return useMutation({
    mutationFn: addVaccination,
    onSuccess: () => {
      // Invalidate both the main list and the dashboard stats
      queryClient.invalidateQueries({ queryKey: ['vaccinations', activeFamily?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', activeFamily?.id] });
    },
  });
};

// UPDATE
const updateVaccination = async (
  { familyId, vaccinationId, updatedVaccination }: { familyId: number, vaccinationId: number, updatedVaccination: Partial<VaccinationFormData> }
): Promise<Vaccination> => {
  const { data } = await familyApi.patch(`/${familyId}/vaccinations/${vaccinationId}`, updatedVaccination);
  return data;
};

export const useUpdateVaccination = () => {
  const queryClient = useQueryClient();
  const { activeFamily } = useAuth();
  
  return useMutation({
    mutationFn: updateVaccination,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations', activeFamily?.id] });
    },
  });
};

// DELETE
const deleteVaccination = async (
  { familyId, vaccinationId }: { familyId: number, vaccinationId: number }
): Promise<void> => {
  await familyApi.delete(`/${familyId}/vaccinations/${vaccinationId}`);
};

export const useDeleteVaccination = () => {
  const queryClient = useQueryClient();
  const { activeFamily } = useAuth();

  return useMutation({
    mutationFn: deleteVaccination,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vaccinations', activeFamily?.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', activeFamily?.id] });
    },
  });
};