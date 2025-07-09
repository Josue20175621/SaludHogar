import { useState, useEffect } from 'react';
import LogoutButton from '../components/LogoutButton';
import { Heart, Users, Plus, User, Trash2, Menu, X, Pencil, ArrowLeft, ChevronRight, UserPlus } from 'lucide-react';
import { familyApi } from '../api/axios';
import MemberDetail from './MemberDetail';
import type { FamilyMemberRaw, FamilyRaw } from '../types/family';

const FAPI = {
  getFamily: async (): Promise<FamilyRaw | null> => {
    try {
      const response = await familyApi.get<FamilyRaw>('');
      return response.data;
    } catch (err) {
      return null;
    }
  },

  createFamily: async (name: string): Promise<FamilyRaw> => {
    try {
      const response = await familyApi.post<FamilyRaw>('', { name });
      return response.data;
    } catch (err) {
      throw new Error(`Failed to create family: ${err}`);
    }
  },

  updateFamily: async (name: string): Promise<FamilyRaw> => {
    try {
      const response = await familyApi.patch<FamilyRaw>('', { name });
      return response.data;
    } catch (err) {
      throw new Error(`Failed to update family: ${err}`);
    }
  },

  deleteFamily: async (): Promise<void> => {
    try {
      await familyApi.delete('');
    } catch (err) {
      throw new Error(`Failed to delete family: ${err}`);
    }
  },

  addMember: async (member: Omit<FamilyMemberRaw, 'id'>): Promise<FamilyMemberRaw> => {
    try {
      const response = await familyApi.post<FamilyMemberRaw>(
        `/members`,
        member
      );
      return response.data;
    } catch (err) {
      throw new Error(`Failed to add member: ${err}`);
    }
  },

  // Update a member in a family
  updateMember: async (memberId: string, member: Partial<Omit<FamilyMemberRaw, 'id'>>): Promise<FamilyMemberRaw> => {
    try {
      const response = await familyApi.patch<FamilyMemberRaw>(
        `/members/${memberId}`,
        member
      );
      return response.data;
    } catch (err) {
      throw new Error(`Failed to update member: ${err}`);
    }
  },

  // Delete a member from a family
  deleteMember: async (memberId: string): Promise<void> => {
    try {
      await familyApi.delete(`/members/${memberId}`);
    } catch (err) {
      throw new Error(`Failed to delete member: ${err}`);
    }
  },
};

function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [family, setFamily] = useState<FamilyRaw | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedMember, setSelectedMember] = useState<FamilyMemberRaw | null>(null);

  const [showNewFamilyForm, setShowNewFamilyForm] = useState(false);
  const [showNewMemberForm, setShowNewMemberForm] = useState(false);
  const [showEditFamilyModal, setShowEditFamilyModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newMember, setNewMember] = useState<Omit<FamilyMemberRaw, 'id'>>({
    first_name: '', last_name: '', birth_date: '', gender: '',
    relation: '', blood_type: '', phone_number: ''
  });
  const [editedFamilyName, setEditedFamilyName] = useState('');
  const [memberToEdit, setMemberToEdit] = useState<FamilyMemberRaw | null>(null);
  const [editedMember, setEditedMember] = useState<FamilyMemberRaw | null>(null);

  useEffect(() => {
    loadFamily();
  }, []);

  const loadFamily = async () => {
    try {
      setLoading(true);
      setError(null);
      const familyData = await FAPI.getFamily();
      setFamily(familyData);
    } catch (err) {
      setError('Error loading family');
      console.error('Error loading family:', err);
    } finally {
      setLoading(false);
    }
  };

  const createFamily = async () => {
    if (!newFamilyName.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const newFamily = await FAPI.createFamily(newFamilyName);
      setFamily(newFamily);
      setNewFamilyName('');
      setShowNewFamilyForm(false);
    } catch (err) {
      setError('Error creating family');
    } finally {
      setLoading(false);
    }
  };

  const updateFamilyName = async () => {
    if (!family || !editedFamilyName.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const updatedFamilyData = await FAPI.updateFamily(editedFamilyName);
      setFamily({ ...family, name: updatedFamilyData.name });
      setShowEditFamilyModal(false);
    } catch (err) {
      setError('Error updating family name');
    } finally {
      setLoading(false);
    }
  };

  const deleteFamily = async () => {
    if (!family) return;
    try {
      setLoading(true);
      setError(null);
      await FAPI.deleteFamily();
      setFamily(null);
      setSelectedMember(null);
    } catch (err) {
      setError('Error deleting family');
    } finally {
      setLoading(false);
    }
  };

  const addMember = async () => {
    if (!family || !newMember.first_name.trim() || !newMember.last_name.trim() || !newMember.birth_date || !newMember.relation || !newMember.blood_type) return;
    try {
      setLoading(true);
      setError(null);
      const addedMember = await FAPI.addMember(newMember);
      const updatedFamily = { ...family, members: [...family.members, addedMember] };
      setFamily(updatedFamily);
      setSelectedMember(addedMember); // Automatically select the new member
      setNewMember({ first_name: '', last_name: '', birth_date: '', gender: '', relation: '', blood_type: '', phone_number: '' });
      setShowNewMemberForm(false);
    } catch (err) {
      setError('Error adding member');
    } finally {
      setLoading(false);
    }
  };

  const updateMember = async () => {
    if (!family || !memberToEdit || !editedMember || !editedMember.first_name.trim() || !editedMember.last_name.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const { id, ...memberData } = editedMember;
      const updatedMemberData = await FAPI.updateMember(memberToEdit.id, memberData);
      const updatedMembers = family.members.map(m => m.id === memberToEdit.id ? updatedMemberData : m);
      setFamily({ ...family, members: updatedMembers });
      // Update selected member if it's the one being edited
      if (selectedMember?.id === memberToEdit.id) {
        setSelectedMember(updatedMemberData);
      }
      setShowEditMemberModal(false);
      setMemberToEdit(null);
    } catch (err) {
      setError('Error updating member');
    } finally {
      setLoading(false);
    }
  };

  const handleFamilyUpdate = (updatedFamily: FamilyRaw | null) => {
    setFamily(updatedFamily);
    // If the selected member is no longer in the list, deselect it
    if (selectedMember && !updatedFamily?.members.some(m => m.id === selectedMember.id)) {
      setSelectedMember(null);
    }
  };

  const deleteMember = async (memberId: string) => {
    if (!family) return;
    if (window.confirm('¿Estás seguro de que quieres eliminar a este miembro?')) {
      try {
        setLoading(true);
        setError(null);
        await FAPI.deleteMember(memberId);
        const updatedMembers = family.members.filter(m => m.id !== memberId);
        const updatedFamily = { ...family, members: updatedMembers };
        handleFamilyUpdate(updatedFamily);
      } catch (err) {
        setError('Error deleting member');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handler to open edit family modal
  const handleEditFamilyClick = () => {
    if (!family) return;
    setEditedFamilyName(family.name);
    setShowEditFamilyModal(true);
  };

  // Handler to open edit member modal
  const handleEditMemberClick = (member: FamilyMemberRaw) => {
    setMemberToEdit(member);
    setEditedMember({ ...member });
    setShowEditMemberModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Error notification */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 text-red-500 hover:text-red-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
              <span>Cargando...</span>
            </div>
          </div>
        </div>
      )}
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-16'} flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${!isSidebarOpen && 'justify-center'}`}>
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-emerald-600" />
              </div>
              {isSidebarOpen && <span className="font-bold text-gray-800">SaludHogar</span>}
            </div>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation & Member List */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {family && isSidebarOpen && (
            <div className="mb-4">
              <h2 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Miembros</h2>
              <div className="space-y-1">
                {family.members.length > 0 ? (
                  family.members.map(member => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMember(member)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${selectedMember?.id === member.id
                          ? 'bg-emerald-100 text-emerald-800 font-semibold'
                          : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <User className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate">{member.first_name} {member.last_name}</span>
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-gray-500">No hay miembros.</p>
                )}
              </div>
            </div>
          )}
        </nav>
        {/* User Section */}
        <div className="p-4 border-t border-gray-200">
          <LogoutButton isSidebarOpen={isSidebarOpen} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side: Family Name and Actions */}
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800">
                {family ? family.name : 'Mi Familia'}
              </h1>
              {family && (
                <>
                  {/* Edit Family Name Button */}
                  <button
                    onClick={handleEditFamilyClick}
                    disabled={loading}
                    className="p-2 text-gray-400 hover:text-emerald-500 transition-colors disabled:opacity-50"
                    title="Editar nombre de familia"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Estás seguro de que quieres eliminar a la familia "${family.name}"? Esta acción no se puede deshacer.`)) {
                        deleteFamily();
                      }
                    }}
                    disabled={loading}
                    className="p-2 text-gray-400 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors disabled:opacity-50"
                    title="Eliminar familia"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Right Side: Primary Action Button */}
            {family && (
              <button
                onClick={() => setShowNewMemberForm(true)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Plus className="w-4 h-4" /> Agregar Miembro
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-6 bg-gray-50">
          {!family ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">¡Bienvenido a SaludHogar!</h2>
                <p className="text-gray-600 mb-6">
                  Comienza creando tu familia para gestionar la información de salud de todos tus seres queridos en un solo lugar.
                </p>
                <button
                  onClick={() => setShowNewFamilyForm(true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 mx-auto"
                >
                  <Plus className="w-5 h-5" /> Crear Mi Familia
                </button>
              </div>
            </div>
          ) : family.members.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserPlus className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-3">Agrega tu primer miembro</h2>
                <p className="text-gray-600 mb-6">
                  Tu familia ya está creada. ¡Ahora solo falta añadir a los miembros para empezar a gestionar su salud!
                </p>
                <button
                  onClick={() => setShowNewMemberForm(true)}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 mx-auto"
                >
                  <Plus className="w-5 h-5" /> Agregar Miembro
                </button>
              </div>
            </div>
          ) : selectedMember ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
              {/* Header for the detail view with actions */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  Detalles de {selectedMember.first_name}
                </h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEditMemberClick(selectedMember)} className="p-2 text-gray-500 hover:text-emerald-600 rounded-lg transition-colors" title="Editar miembro"><Pencil className="w-5 h-5" /></button>
                  <button onClick={() => deleteMember(selectedMember.id)} className="p-2 text-gray-500 hover:text-red-600 rounded-lg transition-colors" title="Eliminar miembro"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
              <MemberDetail member={selectedMember} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
              <div>
                <div className="flex justify-center items-center mx-auto w-16 h-16 bg-emerald-100 rounded-full mb-4">
                  <ArrowLeft className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">Selecciona un miembro</h3>
                <p className="text-gray-500 mt-2 max-w-sm">
                  Haz clic en el nombre de un miembro en la barra lateral para ver sus detalles, editar su información o gestionar su historial de salud.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* New Family Modal */}
      {showNewFamilyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Crear Mi Familia</h3>
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la familia</label>
                  <input
                    type="text"
                    value={newFamilyName}
                    onChange={(e) => setNewFamilyName(e.target.value)}
                    placeholder="Ej: Familia García"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={loading}
                    onKeyPress={(e) => e.key === 'Enter' && createFamily()}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowNewFamilyForm(false)}
                    disabled={loading}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={createFamily}
                    disabled={loading || !newFamilyName.trim()}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    Crear
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Family Modal */}
      {showEditFamilyModal && family && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Editar Nombre de Familia</h3>
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la familia</label>
                  <input
                    type="text"
                    value={editedFamilyName}
                    onChange={(e) => setEditedFamilyName(e.target.value)}
                    placeholder="Ej: Familia García"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    disabled={loading}
                    onKeyPress={(e) => e.key === 'Enter' && updateFamilyName()}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowEditFamilyModal(false)}
                    disabled={loading}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={updateFamilyName}
                    disabled={loading || !editedFamilyName.trim()}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Member Modal */}
      {(showNewMemberForm || (showEditMemberModal && editedMember)) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {showEditMemberModal ? 'Editar Miembro' : 'Nuevo Miembro'}
              </h3>
              <div className="space-y-4">
                {(['first_name', 'last_name', 'birth_date', 'gender', 'relation', 'blood_type', 'phone_number'] as const).map(field => {
                  const labels: Record<typeof field, string> = {
                    first_name: 'Nombre',
                    last_name: 'Apellido',
                    birth_date: 'Fecha de nacimiento',
                    gender: 'Género',
                    relation: 'Parentesco',
                    blood_type: 'Tipo de sangre',
                    phone_number: 'Teléfono (opcional)'
                  };

                  const value = showEditMemberModal ? editedMember?.[field] : newMember[field];
                  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
                    const newValue = e.target.value;
                    if (showEditMemberModal && editedMember) {
                      setEditedMember({ ...editedMember, [field]: newValue });
                    } else {
                      setNewMember({ ...newMember, [field]: newValue });
                    }
                  };

                  if (field === 'gender' || field === 'relation' || field === 'blood_type') {
                    const options: Record<string, string[]> = {
                      gender: ['Masculino', 'Femenino', 'Otro'],
                      relation: ['Padre', 'Madre', 'Hijo/a', 'Hermano/a', 'Abuelo/a', 'Tío/a', 'Primo/a', 'Otro'],
                      blood_type: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
                    };
                    return (
                      <div key={field}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {labels[field]}
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          value={value}
                          onChange={onChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          disabled={loading}
                        >
                          <option value="">Seleccionar...</option>
                          {options[field].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    );
                  }

                  return (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {labels[field]}
                        {field !== 'phone_number' && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type={field === 'birth_date' ? 'date' : field === 'phone_number' ? 'tel' : 'text'}
                        value={value}
                        onChange={onChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        disabled={loading}
                      />
                    </div>
                  );
                })}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      showEditMemberModal ? setShowEditMemberModal(false) : setShowNewMemberForm(false);
                    }}
                    disabled={loading}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={showEditMemberModal ? updateMember : addMember}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    {showEditMemberModal ? 'Guardar Cambios' : 'Agregar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;