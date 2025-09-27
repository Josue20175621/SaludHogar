import React from 'react';
import type { FamilyMember } from '../../types/family';
import { formatDate } from '../../utils/formatters';

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

// Un pequeño componente auxiliar para mantener el diseño consistente
const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-3">
    <dt className="sm:w-1/3 text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 sm:mt-0 sm:w-2/3 text-sm text-gray-900">{value || 'N/D'}</dd>
  </div>
);

interface MemberProfileProps {
  member: FamilyMember;
}

const MemberProfile: React.FC<MemberProfileProps> = ({ member }) => {
  return (
    <div className="bg-white shadow-sm border rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Información personal
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Perfil básico, datos de contacto y antecedentes sociales.
        </p>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <dl className="divide-y divide-gray-200">
          <DetailRow label="Nombre completo" value={`${member.first_name} ${member.last_name}`} />
          <DetailRow label="Parentesco" value={member.relation} />
          <DetailRow label="Fecha de nacimiento" value={member.birth_date ? formatDate(member.birth_date) : 'N/D'} />
          <DetailRow label="Género" value={member.gender} />
          <DetailRow label="Tipo de sangre" value={member.blood_type} />
          <DetailRow label="Número de teléfono" value={member.phone_number} />
          <DetailRow label="Consumo de Tabaco" value={member.tobacco_use} />
          <DetailRow label="Consumo de Alcohol" value={member.alcohol_use} />
          <DetailRow label="Ocupación / Exposición Laboral" value={member.occupation} />
        </dl>
      </div>
    </div>
  );
};

export default MemberProfile;