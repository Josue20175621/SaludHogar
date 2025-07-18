import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { familyApi } from '../api/axios';
import type { Allergy, Condition, Surgery, Hospitalization, FamilyHistoryCondition } from '../types/family';

// A generic fetcher for member-specific data
const fetchMemberData = <T>(dataType: string, familyId: number, memberId: string) =>
  familyApi.get<T[]>(`/${familyId}/members/${memberId}/${dataType}`).then(res => res.data);

// Custom hooks for each data type
export const useAllergies = (memberId?: string) => {
  const { activeFamily } = useAuth();
  return useQuery<Allergy[], Error>({
    queryKey: ['allergies', memberId],
    queryFn: () => fetchMemberData<Allergy>('allergies', activeFamily!.id, memberId!),
    enabled: !!activeFamily && !!memberId,
  });
};

export const useConditions = (memberId?: string) => {
  const { activeFamily } = useAuth();
  return useQuery<Condition[], Error>({
    queryKey: ['conditions', memberId],
    queryFn: () => fetchMemberData<Condition>('conditions', activeFamily!.id, memberId!),
    enabled: !!activeFamily && !!memberId,
  });
};

export const useSurgeries = (memberId?: string) => {
  const { activeFamily } = useAuth();
  return useQuery<Surgery[], Error>({
    queryKey: ['surgeries', memberId],
    queryFn: () => fetchMemberData<Surgery>('surgeries', activeFamily!.id, memberId!),
    enabled: !!activeFamily && !!memberId,
  });
};

export const useHospitalizations = (memberId?: string) => {
  const { activeFamily } = useAuth();
  return useQuery<Hospitalization[], Error>({
    queryKey: ['hospitalizations', memberId],
    queryFn: () => fetchMemberData<Hospitalization>('hospitalizations', activeFamily!.id, memberId!),
    enabled: !!activeFamily && !!memberId,
  });
};

const fetchFamilyHistoryConditions = async (familyId: number): Promise<FamilyHistoryCondition[]> => {
  const { data } = await familyApi.get(`/${familyId}/history`);
  return data;
};

export const useFamilyHistoryConditions = () => {
  const { activeFamily } = useAuth();
  const familyId = activeFamily?.id;

  return useQuery<FamilyHistoryCondition[], Error>({
    queryKey: ['familyhistorycondition', familyId],
    queryFn: () => fetchFamilyHistoryConditions(familyId!),
    enabled: !!familyId,
  });
};