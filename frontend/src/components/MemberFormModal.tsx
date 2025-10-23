import React, { useState } from 'react';
import type { FamilyMember } from '../types/family';
import type { FormEvent } from 'react';

export type MemberFormData = Omit<FamilyMember, 'id' | 'family_id' | 'created_at' | 'age'>;

interface MemberFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MemberFormData) => void;
  initialData: FamilyMember | null;
  isLoading: boolean;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, isLoading }) => {
  const [formData, setFormData] = useState<MemberFormData>({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    birth_date: initialData?.birth_date || '',
    gender: initialData?.gender || '',
    relation: initialData?.relation || '',
    blood_type: initialData?.blood_type || '',
    phone_number: initialData?.phone_number || '',
    tobacco_use: initialData?.tobacco_use || '',
    alcohol_use: initialData?.alcohol_use || '',
    occupation: initialData?.occupation || '',
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
    <div className="fixed inset-0 text-gray-900 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Editar Miembro de la Familia' : 'Agregar Nuevo Miembro'}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Información Personal</h3>
              
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">Nombre</label>
                <input 
                  type="text" 
                  name="first_name" 
                  id="first_name" 
                  value={formData.first_name} 
                  onChange={handleChange} 
                  required 
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm" 
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">Apellido</label>
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
                <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">Fecha de Nacimiento</label>
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
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Género</label>
                <select
                  name="gender"
                  id="gender"
                  value={formData.gender || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                >
                  <option value="">Seleccionar género</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                </select>
              </div>

              <div>
                <label htmlFor="relation" className="block text-sm font-medium text-gray-700">Parentesco</label>
                <input
                  type="text"
                  name="relation"
                  id="relation"
                  value={formData.relation || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                  placeholder="ej. Esposo/a, Hijo/a, Padre/Madre"
                />
              </div>
            </div>

            {/* Right Column - Medical & Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Información Médica y de Contacto</h3>
              
              <div>
                <label htmlFor="blood_type" className="block text-sm font-medium text-gray-700">Tipo de Sangre</label>
                <select
                  name="blood_type"
                  id="blood_type"
                  value={formData.blood_type || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                >
                  <option value="">Seleccionar tipo de sangre</option>
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
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">Número de Teléfono</label>
                <input
                  type="tel"
                  name="phone_number"
                  id="phone_number"
                  value={formData.phone_number || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                  placeholder="ej. +1809123456"
                />
              </div>

              <div>
                <label htmlFor="tobacco_use" className="block text-sm font-medium text-gray-700">Uso de Tabaco</label>
                <select
                  name="tobacco_use"
                  id="tobacco_use"
                  value={formData.tobacco_use || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                >
                  <option value="">Seleccionar uso de tabaco</option>
                  <option value="never">Nunca</option>
                  <option value="former">Ex fumador</option>
                  <option value="current">Fumador actual</option>
                </select>
              </div>

              <div>
                <label htmlFor="alcohol_use" className="block text-sm font-medium text-gray-700">Consumo de Alcohol</label>
                <select
                  name="alcohol_use"
                  id="alcohol_use"
                  value={formData.alcohol_use || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                >
                  <option value="">Seleccionar consumo de alcohol</option>
                  <option value="never">Nunca</option>
                  <option value="occasional">Ocasional</option>
                  <option value="moderate">Moderado</option>
                  <option value="heavy">Frecuente</option>
                </select>
              </div>

              <div>
                <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">Ocupación</label>
                <input
                  type="text"
                  name="occupation"
                  id="occupation"
                  value={formData.occupation || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                  placeholder="ej. Ingeniero, Profesor, Jubilado"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end space-x-4 border-t">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={isLoading} 
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isLoading} 
              className="bg-cyan-600 text-white px-6 py-2 rounded-lg hover:bg-cyan-700 disabled:opacity-50 flex items-center transition-colors"
            >
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
              {initialData ? 'Guardar Cambios' : 'Agregar Miembro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};