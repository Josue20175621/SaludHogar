import React, { useState } from 'react';
import { calculateAge } from '../../utils/formatters';
import { useFamilyMembers, useAddMember, useUpdateMember, useDeleteMember } from '../../hooks/family';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { Trash2, Pencil, Plus } from 'lucide-react';
import type { FamilyMember } from '../../types/family';
import { MemberFormModal } from '../../components/MemberFormModal';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';

export const getRelationBadgeColor = (relation: string | null): string => {
  if (!relation) {
    return 'bg-gray-100 text-gray-700';
  }

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

  const [isManagingProfiles, setIsManagingProfiles] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);

  const addMemberMutation = useAddMember();
  const updateMemberMutation = useUpdateMember();
  const deleteMemberMutation = useDeleteMember();

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member: FamilyMember) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (member: FamilyMember) => {
    setMemberToDelete(member);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setMemberToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleFormSubmit = (formData: MemberFormData) => {
    if (!activeFamily) return;

    const dataToSend = { ...formData };

    if (dataToSend.birth_date === '') {
      dataToSend.birth_date = null;
    }

    if (editingMember) {
      updateMemberMutation.mutate(
        { familyId: activeFamily.id, memberId: editingMember.id, updatedMember: dataToSend },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      addMemberMutation.mutate(
        { familyId: activeFamily.id, newMember: dataToSend },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!activeFamily || !memberToDelete) return;

    deleteMemberMutation.mutate(
      { familyId: activeFamily.id, memberId: memberToDelete.id },
      {
        onSuccess: () => {
          handleCloseDeleteModal(); // Cierra el modal al tener éxito
        },
      }
    );
  };

  const handleToggleManageProfiles = () => {
    setIsManagingProfiles(prev => !prev);
  };

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
    <div className="min-h-[70vh] bg-neutral-900 text-neutral-100 rounded-xl p-6">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold">
          {isManagingProfiles ? 'Administrar Perfiles' : 'Selecciona un perfil'}
        </h2>
      </div>


      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 place-items-center">
        {members?.map(member => (
          <MemberProfileTile
            key={member.id}
            member={member}
            onEdit={() => handleOpenEditModal(member)}
            onDelete={() => handleOpenDeleteModal(member)}
            isManaging={isManagingProfiles}
          />
        ))}

        {/* El botón de agregar perfil ahora es parte de la cuadrícula y se oculta en modo de gestión */}
        {!isManagingProfiles && (
          <button
            onClick={handleOpenAddModal}
            className="flex flex-col items-center gap-3 group cursor-pointer"
          >
            <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-neutral-800 hover:bg-neutral-700 border-2 border-dashed border-neutral-600 hover:border-neutral-500 transition-all flex items-center justify-center group-hover:scale-105">
              <Plus className="w-12 h-12 text-neutral-500 group-hover:text-neutral-300 transition-colors" />
            </div>
            <p className="text-neutral-400 text-center group-hover:text-white transition-colors font-medium">
              Agregar Perfil
            </p>
          </button>
        )}
      </div>

      {members?.length === 0 && !isLoading && (
        <p className="text-center text-neutral-400 mt-10">Aún no se han agregado miembros.</p>
      )}

      <div className="mt-16 flex justify-center">
        <button
          onClick={handleToggleManageProfiles}
          className="px-8 py-3 bg-neutral-800 border border-neutral-600 hover:border-neutral-400 text-neutral-400 hover:text-neutral-200 rounded-md transition-colors"
        >
          {isManagingProfiles ? 'Listo' : 'Administrar Perfiles'}
        </button>
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

      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          isLoading={deleteMemberMutation.isPending}
        />
      )}
    </div>
  );
};

interface MemberProfileTileProps {
  member: FamilyMember;
  onEdit: () => void;
  onDelete: () => void;
  isManaging: boolean;
}

const MemberProfileTile: React.FC<MemberProfileTileProps> = ({ member, onEdit, onDelete, isManaging }) => {
  const { activeFamily } = useAuth();
  const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:8000`;

  const age = member.birth_date ? calculateAge(member.birth_date) : null;
  const initials =
    `${member.first_name?.[0] ?? ''}${member.last_name?.[0] ?? ''}`.toUpperCase() || '?';

  const badgeColor = getRelationBadgeColor(member.relation);

  const tileContent = (
    <div className="group w-36 sm:w-40 md:w-44 lg:w-48 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 rounded-md">
      {/* Avatar container */}
      <div className="relative aspect-square rounded-md overflow-hidden ring-2 ring-transparent group-hover:ring-white/90 group-focus:ring-white/90 transition-all duration-300">
        <img
          src={`${API_URL}/families/${activeFamily?.id}/members/${member.id}/photo`}
          alt={`${member.first_name} ${member.last_name}`}
          loading="lazy"
          className="h-full w-full object-cover select-none group-hover:scale-[1.03] transition-transform duration-300"
          onError={(e) => {
            const target = e.currentTarget;
            target.src =
              'data:image/svg+xml;charset=UTF-8,' +
              encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
                  <defs>
                    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stop-color="#262626"/>
                      <stop offset="100%" stop-color="#1f2937"/>
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#g)"/>
                  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
                        font-size="160" fill="#9ca3af"
                        font-family="system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif"
                        letter-spacing="2">${initials}</text>
                </svg>
              `);
          }}
        />

        {isManaging && (
          <div className={
            `absolute inset-0 bg-black/60 flex justify-center items-center gap-4 transition-opacity duration-300 
            opacity-100 md:opacity-0 md:group-hover:opacity-100`
          }>
            <button
              onClick={onEdit}
              className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
              aria-label={`Editar perfil de ${member.first_name}`}
            >
              <Pencil className="w-6 h-6" />
            </button>
            <button
              onClick={onDelete}
              className="p-3 bg-white/10 rounded-full text-white hover:bg-red-500/80 transition-colors"
              aria-label={`Eliminar perfil de ${member.first_name}`}
            >
              <Trash2 className="w-6 h-6" />
            </button>
          </div>
        )}

        {/* El badge de relación solo se muestra si NO estamos en modo de gestión */}
        {!isManaging && member.relation && (
          <div
            className={
              `absolute top-2 right-2 px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-md ring-1 ring-black/10 max-w-[75%] truncate ` +
              badgeColor
            }
            title={member.relation}
          >
            {member.relation}
          </div>
        )}
      </div>

      {/* Información del Perfil (Nombre, etc.) */}
      <div className="mt-3 text-center">
        <p className="text-sm md:text-base font-medium text-neutral-50 group-hover:text-white transition-colors duration-300 truncate">
          {member.first_name} {member.last_name}
        </p>
        {!isManaging && (
          <p className="text-xs text-neutral-400">
            {age !== null ? `${age} años` : 'Edad desconocida'} • {member.gender || '—'}
          </p>
        )}
      </div>
    </div>
  );

  // Si no estamos en modo de gestión, el perfil es un link.
  // Si lo estamos, es solo un elemento visual con botones internos.
  return isManaging ? (
    tileContent
  ) : (
    <Link to={`/app/members/${member.id}`} className="no-underline">
      {tileContent}
    </Link>
  );
};

export default FamilyMembers;