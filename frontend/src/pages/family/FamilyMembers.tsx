import React, {useState} from 'react';
import { Plus } from 'lucide-react';
import { calculateAge } from '../../utils/formatters';
import { useFamilyMembers, useAddMember, useUpdateMember, useDeleteMember } from '../../hooks/family';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import type { FamilyMember } from '../../types/family';
import { MemberFormModal } from '../../components/MemberFormModal';

export const getRelationBadgeColor = (relation: string): string => {
  const colorMap: Record<string, string> = {
    Padre: 'bg-blue-100 text-blue-800',
    Madre: 'bg-pink-100 text-pink-800',
    Hijo: 'bg-green-100 text-green-800',
    Hija: 'bg-green-100 text-green-800',
    Abuelo: 'bg-yellow-100 text-yellow-800',
    Abuela: 'bg-yellow-100 text-yellow-800',
    Hermano: 'bg-purple-100 text-purple-800',
    Hermana: 'bg-purple-100 text-purple-800',
    Tío: 'bg-indigo-100 text-indigo-800',
    Tía: 'bg-indigo-100 text-indigo-800',
    Primo: 'bg-teal-100 text-teal-800',
    Prima: 'bg-teal-100 text-teal-800',
    Otro: 'bg-gray-200 text-gray-800',
  };

  return colorMap[relation] || 'bg-gray-100 text-gray-700';
};

type MemberFormData = Omit<FamilyMember, 'id' | 'family_id' | 'created_at' | 'age'>;

const FamilyMembers: React.FC = () => {
  const { activeFamily } = useAuth();
  const { members, isLoading, isError } = useFamilyMembers();

  // Modal state and data
  const [isModalOpen, setIsModalOpen] = useState(false);
  // null for "Add" mode, or a FamilyMember object for "Edit" mode
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  // CUD 
  const addMemberMutation = useAddMember();
  const updateMemberMutation = useUpdateMember();
  const deleteMemberMutation = useDeleteMember();

  const handleOpenAddModal = () => {
    setEditingMember(null); // Ensure we are in "Add" mode
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: FamilyMember) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (formData: MemberFormData) => {
    if (!activeFamily) return;

    if (editingMember) {
      // UPDATE mode
      updateMemberMutation.mutate(
        { familyId: activeFamily.id, memberId: editingMember.id, updatedMember: formData },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      // CREATE mode
      addMemberMutation.mutate(
        { familyId: activeFamily.id, newMember: formData },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const handleDeleteMember = (memberId: number) => {
    if (!activeFamily) return;
    // Show a confirmation dialog first!
    if (window.confirm('Are you sure you want to delete this member?')) {
      deleteMemberMutation.mutate({ familyId: activeFamily.id, memberId });
    }
  };

  // Clean
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isError) {
    return <div className="text-center text-red-500">Error al cargar los miembros de la familia.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Miembros de la familia</h2>
        <button
          onClick={handleOpenAddModal}
          className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 flex items-center space-x-2 transition-colors cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>Agregar miembro</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members?.map(member => (
          <MemberCard
            key={member.id}
            member={member}
            onEdit={() => handleOpenEditModal(member)}
            onDelete={() => handleDeleteMember(member.id)}
            isDeleting={deleteMemberMutation.isPending && deleteMemberMutation.variables?.memberId === member.id}
          />
        ))}
        {members?.length === 0 && (
          <p className="col-span-full text-center text-gray-500 mt-8">Aun no se han agregado miembros.</p>
        )}
      </div>

      {isModalOpen && (
        <MemberFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={editingMember}
          isLoading={addMemberMutation.isPending || updateMemberMutation.isPending}
        />
      )}
    </div>
  );
};

interface MemberCardProps {
  member: FamilyMember;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

const MemberCard: React.FC<MemberCardProps> = ({member}) => (
  <Link 
    to={`/app/members/${member.id}`} 
    className="relative block bg-white p-5 rounded-lg shadow-sm border hover:shadow-md hover:-translate-y-1 transition-all duration-200"
  >
    {/* Relation badge with color */}
    <div className={`absolute top-3 right-3 text-xs font-semibold px-3 py-1 rounded-full ${getRelationBadgeColor(member.relation)}`}>
      {member.relation}
    </div>

    <h3 className="text-lg font-bold text-gray-900">
      {member.first_name} {member.last_name}
    </h3>

    <div className="mt-2 flex items-center text-sm text-gray-600 space-x-4">
      <p><span className="font-medium text-gray-500">Género:</span> {member.gender}</p>
      {member.birth_date && (
        <p><span className="font-medium text-gray-500">Edad:</span> {calculateAge(member.birth_date)} años</p>
      )}
    </div>
  </Link>
);

export default FamilyMembers;