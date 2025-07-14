import type { FormEvent } from 'react'
import React, { useState } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { calculateAge, formatDate } from '../../utils/formatters';
import { useFamilyMembers, useAddMember, useUpdateMember, useDeleteMember } from '../../hooks/family';
import { useAuth } from '../../context/AuthContext';
import type { FamilyMember } from '../../types/family';

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
    return <div className="text-center text-red-500">Error loading family members.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Family Members</h2>
        <button
          onClick={handleOpenAddModal}
          className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Member</span>
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
          <p className="col-span-full text-center text-gray-500 mt-8">No family members have been added yet.</p>
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

const MemberCard: React.FC<MemberCardProps> = ({ member, onEdit, onDelete, isDeleting }) => (
  <div className={`bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-all ${isDeleting ? 'opacity-50' : ''}`}>
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{member.first_name} {member.last_name}</h3>
        <p className="text-gray-600">{member.relation}</p>
      </div>
      <div className="flex space-x-1">
        <button onClick={onEdit} className="p-2 text-gray-400 hover:text-cyan-600 rounded-full hover:bg-gray-100 transition-colors" aria-label={`Edit ${member.first_name}`}>
          <Edit className="w-4 h-4" />
        </button>
        <button onClick={onDelete} disabled={isDeleting} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50" aria-label={`Delete ${member.first_name}`}>
          {isDeleting ? <div className="w-4 h-4 border-2 border-gray-400 border-t-red-600 rounded-full animate-spin"></div> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
    <div className="space-y-2 text-sm text-gray-700">
      <p><span className="font-medium text-gray-500">Age:</span> {member.birth_date ? `${calculateAge(member.birth_date)} years` : 'N/A'}</p>
      <p><span className="font-medium text-gray-500">Gender:</span> {member.gender || 'N/A'}</p>
      <p><span className="font-medium text-gray-500">Birth Date:</span> {member.birth_date ? formatDate(member.birth_date) : 'N/A'}</p>
      <p><span className="font-medium text-gray-500">Blood Type:</span> {member.blood_type || 'N/A'}</p>
    </div>
  </div>
);

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MemberFormData) => void;
  initialData: FamilyMember | null;
  isLoading: boolean;
}

const MemberFormModal: React.FC<MemberFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, isLoading }) => {
  const [formData, setFormData] = useState<MemberFormData>({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    birth_date: initialData?.birth_date || '',
    gender: initialData?.gender || '',
    relation: initialData?.relation || '',
    blood_type: initialData?.blood_type || '',
    phone_number: initialData?.phone_number || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Edit Family Member' : 'Add New Member'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">First Name</label>
            <input type="text" name="first_name" id="first_name" value={formData.first_name} onChange={handleChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              name="last_name"
              id="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">Birth Date</label>
            <input
              type="date"
              name="birth_date"
              id="birth_date"
              value={formData.birth_date || ''}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
            <select
              name="gender"
              id="gender"
              value={formData.gender || ''}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label htmlFor="relation" className="block text-sm font-medium text-gray-700">Relation</label>
            <input
              type="text"
              name="relation"
              id="relation"
              value={formData.relation || ''}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="blood_type" className="block text-sm font-medium text-gray-700">Blood Type</label>
            <select
              name="blood_type"
              id="blood_type"
              value={formData.blood_type || ''}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
            >
              <option value="">Select blood type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              name="phone_number"
              id="phone_number"
              value={formData.phone_number || ''}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
              placeholder="e.g. +123456789"
            />
          </div>
          <div className="pt-6 flex justify-end space-x-4">
            <button type="button" onClick={onClose} disabled={isLoading} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-700 disabled:opacity-50 flex items-center">
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
              {initialData ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FamilyMembers;