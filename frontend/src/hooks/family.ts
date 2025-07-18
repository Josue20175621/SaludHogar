import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { FamilyMember } from '../types/family';
import { familyApi } from '../api/axios';

const fetchFamilyMembers = async (familyId: number): Promise<FamilyMember[]> => {
  const { data } = await familyApi.get(`/${familyId}/members`);
  return data;
};

export const useFamilyMembers = () => {
  const { activeFamily } = useAuth();
  const familyId = activeFamily?.id;

  const { data: members, ...queryInfo } = useQuery<FamilyMember[], Error>({
    queryKey: ['familyMembers', familyId],
    queryFn: () => fetchFamilyMembers(familyId!),
    enabled: !!familyId,
  });

  // Create a memoized map for fast lookups. This is the replacement for getMemberName.
  const memberMap = useMemo(() => {
    if (!members) return new Map<number, string>();
    const m = new Map<number, string>();
    members.forEach(x => m.set(x.id, `${x.first_name} ${x.last_name}`));
    return m;
  }, [members]);

  // A map from id -> full member object
  const memberById = useMemo(() => {
    if (!members) return new Map<number, FamilyMember>();
    const m = new Map<number, FamilyMember>();
    members.forEach(x => m.set(x.id, x));
    return m;
  }, [members]);

  return { members, memberMap, memberById, ...queryInfo };
};

// Mutations (CREATE, UPDATE, DELETE)

// CREATE

const addFamilyMember = async (
  { familyId, newMember }: { familyId: number, newMember: Omit<FamilyMember, 'id' | 'family_id'> }
): Promise<FamilyMember> => {
  const { data } = await familyApi.post(`/${familyId}/members`, newMember);
  return data;
};

export const useAddMember = () => {
  const queryClient = useQueryClient();
  const { activeFamily } = useAuth();

  return useMutation({
    mutationFn: addFamilyMember,
    onSuccess: () => {
      // Invalidate the 'familyMembers' query. Marks it stale.
      // React Query will then automatically refetch it, updating the UI.
      queryClient.invalidateQueries({ queryKey: ['familyMembers', activeFamily?.id] });
    },
  });
};

// UPDATE
const updateFamilyMember = async (
  { familyId, memberId, updatedMember }: { familyId: number, memberId: number, updatedMember: Partial<FamilyMember> }
): Promise<FamilyMember> => {
  const { data } = await familyApi.patch(`/${familyId}/members/${memberId}`, updatedMember);
  return data;
};

export const useUpdateMember = () => {
  const queryClient = useQueryClient();
  const { activeFamily } = useAuth();
  
  return useMutation({
    mutationFn: updateFamilyMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers', activeFamily?.id] });
    },
  });
};

// DELETE
const deleteFamilyMember = async (
  { familyId, memberId }: { familyId: number, memberId: number }
): Promise<void> => {
  await familyApi.delete(`/${familyId}/members/${memberId}`);
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();
  const { activeFamily } = useAuth();

  return useMutation({
    mutationFn: deleteFamilyMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers', activeFamily?.id] });
    },
  });
};

// Get member details
const fetchMemberDetails = async (familyId: number, memberId: string | number): Promise<FamilyMember> => {
  const { data } = await familyApi.get(`/${familyId}/members/${memberId}`);
  return data;
};

export const useMemberDetails = (memberId?: string) => {
  const { activeFamily } = useAuth();
  const familyId = activeFamily?.id;

  return useQuery<FamilyMember, Error>({
    queryKey: ['familyMember', familyId, memberId],
    queryFn: () => fetchMemberDetails(familyId!, memberId!),
    enabled: !!familyId && !!memberId,
  });
};