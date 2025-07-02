import { useState, useEffect } from 'react';
import LogoutButton from '../components/LogoutButton';
import { Heart, Users, Plus, User, Trash2, Menu, X, Pencil } from 'lucide-react';
import api from '../api/axios';

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
  // Get all families
  getFamilies: async (): Promise<FamilyRaw[]> => {
    try {
      const response = await api.get<FamilyRaw[]>('/families');
      return response.data;
    } catch (err) {
      throw new Error(`Failed to fetch families: ${err}`);
    }
  },

  // Create a new family
  createFamily: async (name: string): Promise<FamilyRaw> => {
    try {
      const response = await api.post<FamilyRaw>('/families', { name });
      return response.data;
    } catch (err) {
      throw new Error(`Failed to create family: ${err}`);
    }
  },

  // Update a family's name
  updateFamily: async (familyId: string, name: string): Promise<FamilyRaw> => {
    try {
      const response = await api.patch<FamilyRaw>(`/families/${familyId}`, { name });
      return response.data;
    } catch (err) {
      throw new Error(`Failed to update family: ${err}`);
    }
  },

  // Delete a family
  deleteFamily: async (familyId: string): Promise<void> => {
    try {
      await api.delete(`/families/${familyId}`);
    } catch (err) {
      throw new Error(`Failed to delete family: ${err}`);
    }
  },

  // Add a member to a family
  addMember: async (familyId: number, member: Omit<FamilyMemberRaw, 'id'>): Promise<FamilyMemberRaw> => {
    try {
      const response = await api.post<FamilyMemberRaw>(
        `/families/${familyId}/members`,
        member
      );
      return response.data;
    } catch (err) {
      throw new Error(`Failed to add member: ${err}`);
    }
  },

  // Update a member in a family
  updateMember: async (familyId: string, memberId: string, member: Partial<Omit<FamilyMemberRaw, 'id'>>): Promise<FamilyMemberRaw> => {
    try {
      const response = await api.patch<FamilyMemberRaw>(
        `/families/${familyId}/members/${memberId}`,
        member
      );
      return response.data;
    } catch (err) {
      throw new Error(`Failed to update member: ${err}`);
    }
  },

  // Delete a member from a family
  deleteMember: async (familyId: string, memberId: string): Promise<void> => {
    try {
      await api.delete(`/families/${familyId}/members/${memberId}`);
    } catch (err) {
      throw new Error(`Failed to delete member: ${err}`);
    }
  },
};

function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [families, setFamilies] = useState<FamilyRaw[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<FamilyRaw | null>(null);
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
  const [familyToEdit, setFamilyToEdit] = useState<FamilyRaw | null>(null);
  const [editedFamilyName, setEditedFamilyName] = useState('');
  const [memberToEdit, setMemberToEdit] = useState<FamilyMemberRaw | null>(null);
  const [editedMember, setEditedMember] = useState<FamilyMemberRaw | null>(null);

  useEffect(() => {
    loadFamilies();
  }, []);

  const loadFamilies = async () => {
    try {
      setLoading(true);
      setError(null);
      const familiesData = await FAPI.getFamilies();
      setFamilies(familiesData);
    } catch (err) {
      setError('Error loading families');
      console.error('Error loading families:', err);
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
      setFamilies([...families, newFamily]);
      setNewFamilyName('');
      setShowNewFamilyForm(false);
      setSelectedFamily(newFamily);
    } catch (err) {
      setError('Error creating family');
    } finally {
      setLoading(false);
    }
  };

  const updateFamilyName = async () => {
    if (!familyToEdit || !editedFamilyName.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const updatedFamilyData = await FAPI.updateFamily(familyToEdit.id, editedFamilyName);
      const updatedFamilies = families.map(f =>
        f.id === familyToEdit.id ? { ...f, name: updatedFamilyData.name } : f
      );
      setFamilies(updatedFamilies);
      if (selectedFamily?.id === familyToEdit.id) {
        setSelectedFamily({ ...selectedFamily, name: updatedFamilyData.name });
      }
      setShowEditFamilyModal(false);
      setFamilyToEdit(null);
    } catch (err) {
      setError('Error updating family name');
    } finally {
      setLoading(false);
    }
  };

  const deleteFamily = async (familyId: string) => {
    try {
      setLoading(true);
      setError(null);
      await FAPI.deleteFamily(familyId);
      setFamilies(families.filter(f => f.id !== familyId));
      if (selectedFamily?.id === familyId) {
        setSelectedFamily(null);
      }
    } catch (err) {
      setError('Error deleting family');
    } finally {
      setLoading(false);
    }
  };

  const addMember = async () => {
    if (!selectedFamily || !newMember.first_name.trim() || !newMember.last_name.trim() || !newMember.birth_date || !newMember.relation || !newMember.blood_type) return;
    try {
      setLoading(true);
      setError(null);
      const addedMember = await FAPI.addMember(Number(selectedFamily.id), newMember);
      const updatedFamily = { ...selectedFamily, members: [...selectedFamily.members, addedMember] };
      setFamilies(families.map(f => f.id === selectedFamily.id ? updatedFamily : f));
      setSelectedFamily(updatedFamily);
      setNewMember({ first_name: '', last_name: '', birth_date: '', gender: '', relation: '', blood_type: '', phone_number: '' });
      setShowNewMemberForm(false);
    } catch (err) {
      setError('Error adding member');
    } finally {
      setLoading(false);
    }
  };

  const updateMember = async () => {
    if (!selectedFamily || !memberToEdit || !editedMember || !editedMember.first_name.trim() || !editedMember.last_name.trim()) return;
    try {
      setLoading(true);
      setError(null);
      const { id, ...memberData } = editedMember;
      const updatedMemberData = await FAPI.updateMember(selectedFamily.id, memberToEdit.id, memberData);
      const updatedMembers = selectedFamily.members.map(m => m.id === memberToEdit.id ? updatedMemberData : m);
      const updatedFamily = { ...selectedFamily, members: updatedMembers };
      setFamilies(families.map(f => f.id === selectedFamily.id ? updatedFamily : f));
      setSelectedFamily(updatedFamily);
      setShowEditMemberModal(false);
      setMemberToEdit(null);
    } catch (err) {
      setError('Error updating member');
    } finally {
      setLoading(false);
    }
  };

  const deleteMember = async (memberId: string) => {
    if (!selectedFamily) return;
    try {
      setLoading(true);
      setError(null);
      await FAPI.deleteMember(selectedFamily.id, memberId);
      const updatedFamily = { ...selectedFamily, members: selectedFamily.members.filter(m => m.id !== memberId) };
      setFamilies(families.map(f => f.id === selectedFamily.id ? updatedFamily : f));
      setSelectedFamily(updatedFamily);
    } catch (err) {
      setError('Error deleting member');
    } finally {
      setLoading(false);
    }
  };

  // Handlers to open edit modals
  const handleEditFamilyClick = (family: FamilyRaw) => {
    setFamilyToEdit(family);
    setEditedFamilyName(family.name);
    setShowEditFamilyModal(true);
  };
  
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
              <Users className="w-5 h-5" />
              {isSidebarOpen && <span>Familias</span>}
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
            <h1 className="text-2xl font-bold text-gray-800">Gestión de Familias</h1>
            <button onClick={() => setShowNewFamilyForm(true)} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
              <Plus className="w-4 h-4" /> Nueva Familia
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Families List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-gray-800">Mis Familias</h2>
                    <button onClick={loadFamilies} className="p-1 text-gray-400 hover:text-gray-600 transition-colors" title="Refresh families"><Users className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {families.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No tienes familias creadas</p>
                      <p className="text-sm text-gray-400">Crea tu primera familia para comenzar</p>
                    </div>
                  ) : (
                    families.map(family => (
                      <div key={family.id} className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedFamily?.id === family.id ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => setSelectedFamily(family)}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-800">{family.name}</h3>
                            <p className="text-sm text-gray-500">{family.members.length} miembros</p>
                          </div>
                          <div className="flex items-center">
                            <button onClick={(e) => { e.stopPropagation(); handleEditFamilyClick(family); }} disabled={loading} className="p-1 text-gray-400 hover:text-emerald-500 transition-colors disabled:opacity-50"><Pencil className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteFamily(family.id); }} disabled={loading} className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Family Details */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full">
                {selectedFamily ? (
                  <>
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-800">{selectedFamily.name}</h2>
                        <button onClick={() => setShowNewMemberForm(true)} disabled={loading} className="flex items-center gap-2 px-3 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50"><Plus className="w-4 h-4" /> Agregar Miembro</button>
                      </div>
                    </div>
                    <div className="p-4">
                      {selectedFamily.members.length === 0 ? (
                        <div className="text-center py-8">
                          <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No hay miembros en esta familia</p>
                          <p className="text-sm text-gray-400">Agrega el primer miembro para comenzar</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {selectedFamily.members.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-gray-600" /></div>
                                <div>
                                  <h3 className="font-medium text-gray-800">{member.first_name} {member.last_name}</h3>
                                  <p className="text-sm text-gray-500">{member.gender} • {member.birth_date}{member.relation && ` • ${member.relation}`}</p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <button onClick={() => handleEditMemberClick(member)} disabled={loading} className="p-2 text-gray-400 hover:text-emerald-500 transition-colors disabled:opacity-50"><Pencil className="w-4 h-4" /></button>
                                <button onClick={() => deleteMember(member.id)} disabled={loading} className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">Selecciona una familia</h3>
                      <p className="text-gray-500">Elige una familia de la lista para ver sus miembros</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* New Family Modal */}
      {showNewFamilyForm && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Nueva Familia</h3>
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la familia</label>
                  <input type="text" value={newFamilyName} onChange={(e) => setNewFamilyName(e.target.value)} placeholder="Ej: Familia García" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" disabled={loading} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowNewFamilyForm(false)} disabled={loading} className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">Cancelar</button>
                  <button onClick={createFamily} disabled={loading} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">Crear</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Family Modal */}
      {showEditFamilyModal && familyToEdit && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Editar Nombre de Familia</h3>
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la familia</label>
                  <input type="text" value={editedFamilyName} onChange={(e) => setEditedFamilyName(e.target.value)} placeholder="Ej: Familia García" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" disabled={loading} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowEditFamilyModal(false)} disabled={loading} className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">Cancelar</button>
                  <button onClick={updateFamilyName} disabled={loading} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">Guardar Cambios</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Member Modal */}
      {(showNewMemberForm || (showEditMemberModal && editedMember)) && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md my-8">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{showEditMemberModal ? 'Editar Miembro' : 'Nuevo Miembro'}</h3>
              <div className="space-y-4">
                {(['first_name', 'last_name', 'birth_date', 'gender', 'relation', 'blood_type', 'phone_number'] as const).map(field => {
                  const labels: Record<typeof field, string> = {
                    first_name: 'Nombre', last_name: 'Apellido', birth_date: 'Fecha de nacimiento',
                    gender: 'Género', relation: 'Parentesco', blood_type: 'Tipo de sangre', phone_number: 'Teléfono (opcional)'
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">{labels[field]}</label>
                        <select value={value} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" disabled={loading}>
                          <option value="">Seleccionar...</option>
                          {options[field].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={field}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{labels[field]}</label>
                      <input type={field === 'birth_date' ? 'date' : field === 'phone_number' ? 'tel' : 'text'} value={value} onChange={onChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" disabled={loading} />
                    </div>
                  );
                })}

                <div className="flex gap-3 pt-4">
                  <button onClick={() => { showEditMemberModal ? setShowEditMemberModal(false) : setShowNewMemberForm(false); }} disabled={loading} className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">Cancelar</button>
                  <button onClick={showEditMemberModal ? updateMember : addMember} disabled={loading} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">{showEditMemberModal ? 'Guardar Cambios' : 'Agregar'}</button>
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