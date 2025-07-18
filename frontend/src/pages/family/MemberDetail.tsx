import { useParams, Link, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import { calculateAge } from '../../utils/formatters';
import { useUpdateMember, useDeleteMember, useMemberDetails } from '../../hooks/family';
import { Edit, Trash2, ArrowLeft, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MemberFormModal, type MemberFormData } from '../../components/MemberFormModal';

import { Tabs, Tab } from '../../components/Tabs';

import MemberProfile from './MemberProfile';
import { Allergies } from './Allergies';
import { Conditions } from './Conditions';
import { Surgeries } from './Surgeries'
import { Hospitalizations } from './Hospitalizations';
import { FamilyHistoryConditions } from './FamilyHistoryCondition';

import { MemberAppointments } from './MemberAppointments';
import { MemberVaccinations } from './MemberVaccinations';
import { MemberMedications } from './MemberMedications';
import { familyApi } from '../../api/axios';

type ActiveTab = 'profile' | 'conditions' | 'allergies' | 'surgeries' | 'hospitalizations' | 'appointments' | 'medications' | 'vaccinations' | 'familyhistorycondition';

const MemberDetail: React.FC = () => {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const { activeFamily } = useAuth();

  const { data: member, isLoading, isError, error } = useMemberDetails(memberId);

  // State for managing the active tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');

  // State for the Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Use the mutation hooks
  const updateMemberMutation = useUpdateMember();
  const deleteMemberMutation = useDeleteMember();



  const handleUpdateSubmit = (formData: MemberFormData) => {
    if (!activeFamily || !memberId) return;

    // Call the mutate function from the useUpdateMember hook
    updateMemberMutation.mutate(
      { familyId: activeFamily.id, memberId: parseInt(memberId), updatedMember: formData },
      {
        onSuccess: () => { setIsEditModalOpen(false); },
        // You could also add an `onError` callback here to show an error toast
      }
    );
  };

  const handleDelete = () => {
    if (!activeFamily || !memberId) return;
    if (window.confirm('Are you sure you want to delete this member? This will also delete all associated health records.')) {
      deleteMemberMutation.mutate(
        { familyId: activeFamily.id, memberId: parseInt(memberId) },
        {
          onSuccess: () => {
            // On successful deletion, navigate back to the members list
            navigate('/app/members');
          },
        }
      );
    }
  };

  const handleReport = async () => {
    try {
      const response = await familyApi.get(`/${activeFamily?.id}/members/${memberId}/medical-report/pdf`, {
        responseType: 'blob', // Required for binary PDF data
        headers: {
          Accept: 'application/pdf', // Override default JSON header
        },
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });

      // Optional: extract filename from headers
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'informe_medico.pdf';

      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      // Trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  // --- Render based on the query state ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-cyan-600 rounded-full animate-spin"></div>
        <p className="ml-4 text-gray-600">Cargando informacion del miembro...</p>
      </div>
    );
  }

  if (isError) {
    // We can even show the error message from the API
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  // If the query is disabled (e.g., no familyId) or returns no data
  if (!member) {
    return (
      <div className="text-center text-gray-500">
        <p>Miembro no encontrado.</p>
        <Link to="/app/members" className="text-cyan-600 hover:underline">
          ← Volver a Miembros
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Link to="/app/members" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a Miembros
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{member.first_name} {member.last_name}</h1>
          <p className="text-gray-600">{member.relation}</p>
          <p><span className="font-medium text-gray-500">Edad:</span> {member.birth_date ? `${calculateAge(member.birth_date)} años` : 'N/A'}</p>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={handleReport}
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-cyan-700 flex items-center gap-2 transition-all duration-200 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Generar informe médico
          </button>
          {/* <button
            onClick={() => setIsEditModalOpen(true)}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"
          >
            <Edit className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMemberMutation.isPending}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button> */}
        </div>
      </div>

      <Tabs>
        <Tab label="Perfil" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        <Tab label="Condiciones" isActive={activeTab === 'conditions'} onClick={() => setActiveTab('conditions')} />
        <Tab label="Alergias" isActive={activeTab === 'allergies'} onClick={() => setActiveTab('allergies')} />
        <Tab label="Cirugías" isActive={activeTab === 'surgeries'} onClick={() => setActiveTab('surgeries')} />
        <Tab label="Hospitalizaciones" isActive={activeTab === 'hospitalizations'} onClick={() => setActiveTab('hospitalizations')} />
        <Tab label="Antecedentes Familiares" isActive={activeTab === 'familyhistorycondition'} onClick={() => setActiveTab('familyhistorycondition')} />
        <Tab label="Citas" isActive={activeTab === 'appointments'} onClick={() => setActiveTab('appointments')} />
        <Tab label="Medicamentos" isActive={activeTab === 'medications'} onClick={() => setActiveTab('medications')} />
        <Tab label="Vacunas" isActive={activeTab === 'vaccinations'} onClick={() => setActiveTab('vaccinations')} />
      </Tabs>

      <div className="mt-4">
        {activeTab === 'profile' && <MemberProfile member={member} />}
        {activeTab === 'allergies' && <Allergies memberId={memberId!} />}
        {activeTab === 'conditions' && <Conditions memberId={memberId!} />}
        {activeTab === 'surgeries' && <Surgeries memberId={memberId!} />}
        {activeTab === 'hospitalizations' && <Hospitalizations memberId={memberId!} />}
        {activeTab === 'familyhistorycondition' && <FamilyHistoryConditions />}
        {activeTab === 'appointments' && <MemberAppointments memberId={memberId!} />}
        {activeTab === 'medications' && <MemberMedications memberId={memberId!} />}
        {activeTab === 'vaccinations' && <MemberVaccinations memberId={memberId!} />}
      </div>

      {/* {isEditModalOpen && (
        <MemberFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateSubmit}
          initialData={member}
          isLoading={updateMemberMutation.isPending}
        />
      )} */}
    </div>
  );
};

export default MemberDetail