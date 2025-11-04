import React from 'react';
import {
  User,
  Users,
  Cake,
  Heart,
  Phone,
  Briefcase,
  Droplet,
  CigaretteOff,
  WineOff
} from 'lucide-react';

import type { FamilyMember } from '../../types/family';
import { formatDate } from '../../utils/formatters';

interface RowProps {
  label: string;
  value: React.ReactNode;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconColor: string;
}

const Row: React.FC<RowProps> = ({ label, value, Icon, iconColor }) => (
  <div className="py-3 flex flex-col sm:flex-row sm:items-center hover:bg-gray-50 transition-colors">
    <dt className="sm:w-1/3 flex items-center space-x-2 text-base font-medium text-gray-700">
      <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={2} />
      <span>{label}</span>
    </dt>
    <dd className="mt-1 sm:mt-0 sm:w-2/3 text-base text-gray-900">
      {value || 'N/D'}
    </dd>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mt-8">
    <h4 className="text-sm font-semibold text-gray-600 tracking-wide uppercase mb-3 border-b border-gray-200 pb-1">
      {title}
    </h4>
    <dl className="divide-y divide-gray-200">
      {children}
    </dl>
  </section>
);

interface MemberProfileProps {
  member: FamilyMember;
}

const MemberProfile: React.FC<MemberProfileProps> = ({ member }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="px-4 py-6 sm:px-6 bg-gray-50 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">Información personal</h3>
        <p className="mt-1 text-sm text-gray-500">Perfil básico, contacto y antecedentes sociales.</p>
      </div>

      <div className="px-4 py-6 sm:px-6">

        <Section title="Datos Básicos">
          <Row label="Nombre completo" value={`${member.first_name} ${member.last_name}`} Icon={User} iconColor="text-blue-500" />
          <Row label="Parentesco" value={member.relation} Icon={Users} iconColor="text-indigo-500" />
          <Row label="Fecha de nacimiento" value={member.birth_date ? formatDate(member.birth_date) : 'N/D'} Icon={Cake} iconColor="text-amber-500" />
          <Row label="Género" value={member.gender} Icon={Heart} iconColor="text-rose-500" />
        </Section>

        <Section title="Contacto">
          <Row
            label="Número de teléfono"
            value={
              member.phone_number ? (
                <a href={`tel:${member.phone_number}`} className="text-blue-600 underline">
                  {member.phone_number}
                </a>
              ) : 'N/D'
            }
            Icon={Phone}
            iconColor="text-sky-500"
          />
        </Section>

        <Section title="Salud y Estilo de Vida">
          <Row label="Tipo de sangre" value={member.blood_type} Icon={Droplet} iconColor="text-red-500" />
          <Row label="Consumo de Tabaco" value={member.tobacco_use} Icon={CigaretteOff} iconColor="text-gray-500" />
          <Row label="Consumo de Alcohol" value={member.alcohol_use} Icon={WineOff} iconColor="text-purple-500" />
        </Section>

        <Section title="Ocupación">
          <Row label="Ocupación / Exposición Laboral" value={member.occupation} Icon={Briefcase} iconColor="text-emerald-600" />
        </Section>
      </div>
    </div>
  );
};

export default MemberProfile;
