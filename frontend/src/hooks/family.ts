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

  // Fetch the members using useQuery
  const { data: members, ...queryInfo } = useQuery<FamilyMember[], Error>({
    queryKey: ['familyMembers', familyId],
    queryFn: () => fetchFamilyMembers(familyId!),
    enabled: !!familyId,
  });

  // Create a memoized map for fast lookups. This is the replacement for getMemberName.
  const memberMap = useMemo(() => {
    if (!members) return new Map<number, string>();
    
    const newMap = new Map<number, string>();
    for (const member of members) {
      newMap.set(member.id, `${member.first_name} ${member.last_name}`);
    }
    return newMap;
  }, [members]);

  return { members, memberMap, ...queryInfo };
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