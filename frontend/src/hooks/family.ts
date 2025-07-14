import { useQuery } from '@tanstack/react-query';
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