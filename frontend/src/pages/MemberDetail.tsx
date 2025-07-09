import { useState } from 'react';
import type { FamilyMemberRaw } from '../types/family';
import { Calendar, Pill, Info, Plus, User } from 'lucide-react';

interface MemberDetailProps {
  member: FamilyMemberRaw;
}

function MemberDetail({ member }: MemberDetailProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'appointments' | 'medications'>('info');

  const TabButton = ({ tab, label, icon }: { tab: typeof activeTab; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-emerald-100 text-emerald-700'
          : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );

   const PlaceholderContent = ({ title, description }: { title: string; description: string }) => (
     <div className="text-center py-16 px-6 bg-gray-50 rounded-lg">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {title === "Citas Médicas" ? <Calendar className="w-8 h-8 text-emerald-500" /> : <Pill className="w-8 h-8 text-emerald-500" />}
        </div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-gray-500 mt-2">{description}</p>
        <button className="mt-6 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 mx-auto">
            <Plus className="w-4 h-4" /> Agregar {title.slice(0,-1)}
        </button>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Member Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{member.first_name} {member.last_name}</h2>
            <p className="text-gray-600">{member.relation}</p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <TabButton tab="info" label="Información General" icon={<Info className="w-4 h-4" />} />
          <TabButton tab="appointments" label="Citas" icon={<Calendar className="w-4 h-4" />} />
          <TabButton tab="medications" label="Medicamentos" icon={<Pill className="w-4 h-4" />} />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'info' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles Personales</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg"><strong className="text-gray-600">Nombre Completo:</strong> {member.first_name} {member.last_name}</div>
                <div className="bg-gray-50 p-3 rounded-lg"><strong className="text-gray-600">Parentesco:</strong> {member.relation}</div>
                <div className="bg-gray-50 p-3 rounded-lg"><strong className="text-gray-600">Fecha de Nacimiento:</strong> {member.birth_date}</div>
                <div className="bg-gray-50 p-3 rounded-lg"><strong className="text-gray-600">Género:</strong> {member.gender}</div>
                <div className="bg-gray-50 p-3 rounded-lg"><strong className="text-gray-600">Tipo de Sangre:</strong> {member.blood_type || 'No especificado'}</div>
                <div className="bg-gray-50 p-3 rounded-lg"><strong className="text-gray-600">Teléfono:</strong> {member.phone_number || 'No especificado'}</div>
            </div>
          </div>
        )}
        {activeTab === 'appointments' && (
          <PlaceholderContent
            title="Citas Médicas" 
            description={`Aquí podrás ver y gestionar las próximas citas médicas de ${member.first_name}.`} 
          />
        )}
        {activeTab === 'medications' && (
          <PlaceholderContent
            title="Medicamentos" 
            description={`Lleva un registro de todos los medicamentos que ${member.first_name} está tomando.`} 
          />
        )}
      </div>
    </div>
  );
}

export default MemberDetail;