import { useState, useEffect } from 'react';
import LogoutButton from '../components/LogoutButton';
import { Heart, Users, Plus, User, Trash2, Menu, X, Pencil } from 'lucide-react';
import { familyApi } from '../api/axios';

interface FamilyMemberRaw {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  relation: string;
  blood_type: string;
  phone_number: string;
}

interface FamilyRaw {
  id: string;
  name: string;
  members: FamilyMemberRaw[];
}

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
      setFamily({ ...family, members: [...family.members, addedMember] });
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
      setShowEditMemberModal(false);
      setMemberToEdit(null);
    } catch (err) {
      setError('Error updating member');
    } finally {
      setLoading(false);
    }
  };

  const deleteMember = async (memberId: string) => {
    if (!family) return;
    try {
      setLoading(true);
      setError(null);
      await FAPI.deleteMember(memberId);
      setFamily({ ...family, members: family.members.filter(m => m.id !== memberId) });
    } catch (err) {
      setError('Error deleting member');
    } finally {
      setLoading(false);
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
        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-emerald-700 bg-emerald-50 rounded-lg font-medium">
              <User className="w-5 h-5" />
              {isSidebarOpen && <span>Miembros</span>}
            </button>
          </div>
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
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-800">
                {family ? family.name : 'Mi Familia'}
              </h1>
              {family && (
                <button 
                  onClick={handleEditFamilyClick} 
                  disabled={loading} 
                  className="p-2 text-gray-400 hover:text-emerald-500 transition-colors disabled:opacity-50"
                  title="Editar nombre de familia"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
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

        {/* Content Area */}
        <main className="flex-1 p-6">
          {!family ? (
            /* No Family State */
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
          ) : (
            /* Family Members */
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Miembros de la Familia</h2>
                    <p className="text-gray-600">{family.members.length} miembros registrados</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={loadFamily} 
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors" 
                      title="Actualizar lista"
                    >
                      <Users className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={deleteFamily} 
                      disabled={loading} 
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Eliminar familia"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {family.members.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No hay miembros registrados</h3>
                    <p className="text-gray-500 mb-6">Agrega el primer miembro de tu familia para comenzar</p>
                    <button 
                      onClick={() => setShowNewMemberForm(true)} 
                      disabled={loading} 
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 mx-auto"
                    >
                      <Plus className="w-4 h-4" /> Agregar Primer Miembro
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {family.members.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-800">{member.first_name} {member.last_name}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{member.relation}</span>
                              <span>•</span>
                              <span>{member.gender}</span>
                              <span>•</span>
                              <span>{member.birth_date}</span>
                              {member.blood_type && (
                                <>
                                  <span>•</span>
                                  <span>Tipo {member.blood_type}</span>
                                </>
                              )}
                            </div>
                            {member.phone_number && (
                              <p className="text-sm text-gray-500 mt-1">{member.phone_number}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleEditMemberClick(member)} 
                            disabled={loading} 
                            className="p-2 text-gray-400 hover:text-emerald-500 transition-colors disabled:opacity-50"
                            title="Editar miembro"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteMember(member.id)} 
                            disabled={loading} 
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                            title="Eliminar miembro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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