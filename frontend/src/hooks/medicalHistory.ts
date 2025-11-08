import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { familyApi } from '../api/axios';
import type { Allergy, Condition, Surgery, Hospitalization, FamilyHistoryCondition } from '../types/family';

// Tipos válidos de recurso miembro
type MemberDataType = 'allergies' | 'conditions' | 'surgeries' | 'hospitalizations';

interface MemberDataMap {
  allergies: Allergy;
  conditions: Condition;
  surgeries: Surgery;
  hospitalizations: Hospitalization;
}

// Generic query
export const useMedicalHistory = <T extends MemberDataType>(
  type: T,
  memberId?: string
) => {
  const { activeFamily } = useAuth();

  return useQuery<MemberDataMap[T][], Error>({
    queryKey: [type, memberId],
    queryFn: async () => {
      const { data } = await familyApi.get<MemberDataMap[T][]>(
        `/${activeFamily!.id}/members/${memberId}/${type}`
      );
      return data;
    },
    enabled: !!activeFamily && !!memberId,
  });
};

// Generic Mutations
export const useMedicalHistoryMutations = <T extends MemberDataType>(
  type: T,
  memberId?: string
) => {
  const { activeFamily } = useAuth();
  const queryClient = useQueryClient();
  const familyId = activeFamily!.id;
  const queryKey = [type, memberId];

  // Crear
  const addItem = useMutation({
    mutationFn: (data: Partial<MemberDataMap[T]>) =>
      familyApi.post(`/${familyId}/members/${memberId}/${type}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // Editar
  const editItem = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: Partial<MemberDataMap[T]>;
    }) =>
      familyApi.put(`/${familyId}/members/${memberId}/${type}/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // Eliminar
  const deleteItem = useMutation({
    mutationFn: (id: number | string) =>
      familyApi.delete(`/${familyId}/members/${memberId}/${type}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { addItem, editItem, deleteItem };
};

//  Antecedentes familiares
const fetchFamilyHistoryConditions = async (
  familyId: number
): Promise<FamilyHistoryCondition[]> => {
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

export const useFamilyHistoryConditionMutations = () => {
  const { activeFamily } = useAuth();
  const queryClient = useQueryClient();
  const familyId = activeFamily!.id;
  const queryKey = ['familyhistorycondition', familyId];

  const addFamilyHistory = useMutation({
    mutationFn: (data: Partial<FamilyHistoryCondition>) =>
      familyApi.post(`/${familyId}/history`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const editFamilyHistory = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number | string;
      data: Partial<FamilyHistoryCondition>;
    }) => familyApi.put(`/${familyId}/history/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteFamilyHistory = useMutation({
    mutationFn: (id: number | string) =>
      familyApi.delete(`/${familyId}/history/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { addFamilyHistory, editFamilyHistory, deleteFamilyHistory };
};
