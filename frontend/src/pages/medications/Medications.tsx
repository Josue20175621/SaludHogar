import type { FormEvent } from 'react'
import React, { useState, useEffect } from 'react';
import { Plus, Calendar, User, Beaker, Repeat, Clock, Pencil, Trash2, Pill, X, CalendarDays } from 'lucide-react';
import type { Medication, FamilyMember } from '../../types/family';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import { DaySelector } from '../../components/DaySelector';
import { useFamilyMembers } from '../../hooks/family';
import { useNotifier } from '../../context/NotificationContext';
import {
  useMedications,
  useAddMedication,
  useUpdateMedication,
  useDeleteMedication,
} from '../../hooks/medications';
import ConfirmDeleteModal from '../../components/ConfirmDeleteModal';

const Medications: React.FC = () => {
  const { activeFamily } = useAuth();
  const { data: medications, isLoading: isLoadingMedications } = useMedications();
  const { memberById: memberMap, isLoading: isLoadingMembers } = useFamilyMembers();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [medicationToDelete, setMedicationToDelete] = useState<Medication | null>(null);

  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  const addMedicationMutation = useAddMedication();
  const updateMedicationMutation = useUpdateMedication();
  const deleteMedicationMutation = useDeleteMedication();

  const handleOpenAddModal = () => {
    setEditingMedication(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (medication: Medication) => {
    setEditingMedication(medication);
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (medication: Medication) => {
    setMedicationToDelete(medication);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setMedicationToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleFormSubmit = (formData: any) => {
    if (!activeFamily) return;

    if (editingMedication) {
      updateMedicationMutation.mutate(
        { familyId: activeFamily.id, medicationId: editingMedication.id, updatedMedication: formData },
        { onSuccess: () => setIsModalOpen(false) }
      );
    } else {
      addMedicationMutation.mutate(
        { familyId: activeFamily.id, newMedication: formData },
        { onSuccess: () => setIsModalOpen(false) }
      );
    }
  };

  const handleConfirmDelete = () => {
    if (!activeFamily || !medicationToDelete) return;

    deleteMedicationMutation.mutate(
      { familyId: activeFamily.id, medicationId: medicationToDelete.id },
      {
        onSuccess: () => {
          handleCloseDeleteModal();
        }
      }
    );
  };

  const membersList = Array.from(memberMap.values());

  const filteredMedications = medications?.filter((med) => 
    selectedMemberId === null ? true : med.member_id === selectedMemberId
  );

  const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:8000`;


  if (isLoadingMedications || isLoadingMembers) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Medicamentos</h2>
        <button
          onClick={handleOpenAddModal}
          className="bg-purple-600 text-white rounded-full p-3 sm:rounded-lg sm:px-4 sm:py-2 flex items-center sm:space-x-2 transition-colors hover:bg-purple-700 fixed bottom-6 right-6 sm:static shadow-lg sm:shadow-none z-30 sm:z-auto"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline font-semibold">Agregar medicamento</span>
        </button>
      </div>

      {medications && medications.length > 0 && (
        <div className="flex gap-2 items-center pb-4 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap scrollbar-hide">
          <button
            onClick={() => setSelectedMemberId(null)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all border whitespace-nowrap ${
              selectedMemberId === null
                ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            Todos
          </button>
          
          {membersList.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedMemberId(member.id)}
              className={`flex-shrink-0 flex items-center px-3 py-2 rounded-full text-sm font-medium transition-all border whitespace-nowrap ${
                selectedMemberId === member.id
                  ? 'bg-purple-100 text-purple-800 border-purple-300 shadow-sm ring-1 ring-purple-300'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="w-6 h-6 rounded-full overflow-hidden mr-2 flex-shrink-0 bg-gray-200 border border-gray-100">
                 <img
                    src={`${API_URL}/families/${activeFamily?.id}/members/${member.id}/photo`}
                    alt={member.first_name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
              </div>
              {member.first_name}
            </button>
          ))}
        </div>
      )}

      {filteredMedications && filteredMedications.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredMedications.map(medication => (
            <MedicationCard
              key={medication.id}
              medication={medication}
              member={memberMap.get(medication.member_id)}
              activeFamilyId={activeFamily?.id}
              onEdit={handleOpenEditModal}
              onDelete={handleOpenDeleteModal}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
          <div className="inline-flex p-3 bg-purple-50 rounded-full mb-4">
            <Pill className="w-6 h-6 text-purple-400" />
          </div>
          {medications && medications.length > 0 ? (
             <>
               <p className="text-sm font-medium text-gray-700 mb-1">No hay resultados para este filtro</p>
               <button 
                 onClick={() => setSelectedMemberId(null)}
                 className="text-purple-600 text-sm font-semibold hover:underline mt-2"
               >
                 Ver todos los medicamentos
               </button>
             </>
          ) : (
             <>
              <p className="text-sm font-medium text-gray-700 mb-1">No hay medicamentos activos</p>
              <p className="text-xs text-gray-500 mb-4">Los medicamentos registrados aparecerán aquí</p>
             </>
          )}
        </div>
      )}

      {isModalOpen && (
        <MedicationFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFormSubmit}
          initialData={editingMedication}
          familyMembers={Array.from(memberMap.values())}
          isLoading={addMedicationMutation.isPending || updateMedicationMutation.isPending}
        />
      )}

      {isDeleteModalOpen && (
        <ConfirmDeleteModal
          isOpen={isDeleteModalOpen}
          onClose={handleCloseDeleteModal}
          onConfirm={handleConfirmDelete}
          isLoading={deleteMedicationMutation.isPending}
        />
      )}
    </div>
  );
};

interface MedicationCardProps {
  medication: Medication;
  member?: FamilyMember;
  activeFamilyId?: number;
  onEdit: (medication: Medication) => void;
  onDelete: (medication: Medication) => void;
}

const MedicationCard: React.FC<MedicationCardProps> = ({ medication, member, activeFamilyId, onEdit, onDelete }) => {

  const isActive = () => {
    if (!medication.start_date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(medication.start_date);
    if (startDate > today) return false;
    if (medication.end_date) {
      const endDate = new Date(medication.end_date);
      return endDate >= today;
    }
    return true;
  };

  // Input: [0,2], Output: "Lun, Mié"
  const formatDays = (days: number[] | null) => {
    if (!days || days.length === 0 || days.length === 7) return "Todos los días";

    const dayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    return days.sort().map(d => dayLabels[d]).join(', ');
  };

  const API_URL =
    import.meta.env.VITE_API_BASE_URL ||
    `${window.location.protocol}//${window.location.hostname}:8000`;

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 flex flex-col">
      <div className="bg-gradient-to-br from-purple-50 to-white p-4 rounded-t-xl border-b border-purple-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full mr-4 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
              <img
                key={member?.id}
                src={`${API_URL}/families/${activeFamilyId}/members/${member?.id}/photo`}
                alt={`${member?.first_name} ${member?.last_name}`}
                loading="lazy"
                className="h-full w-full object-cover select-none"
                onError={(e) => {
                  const target = e.currentTarget;
                  const initials = `${member?.first_name?.[0] || ''}${member?.last_name?.[0] || ''}`;
                  target.src = 'data:image/svg+xml;charset=UTF-8,' +
                    encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#262626"/><stop offset="100%" stop-color="#1f2937"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="160" fill="#9ca3af" font-family="system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif" letter-spacing="2">${initials}</text></svg>
              `);
                }}
              />
            </div>
            <div>
              <h3 className="font-bold text-lg text-purple-900">{medication.name}</h3>
              <p className="text-purple-500 text-sm font-bold">{`${member?.first_name} ${member?.last_name}`}</p>
            </div>
          </div>
          {isActive() && (
            <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
              Activo
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 flex-grow">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <div className="space-y-1">
            <div className="flex items-center text-xs text-gray-500 font-semibold uppercase">
              <Beaker className="w-4 h-4 mr-1.5 text-purple-900" />
              <span>Dosis</span>
            </div>
            <p className="text-base font-bold text-purple-900 pl-6">{medication.dosage}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center text-xs text-gray-500 font-semibold uppercase">
              <Repeat className="w-4 h-4 mr-1.5 text-purple-900" />
              <span>Frecuencia</span>
            </div>
            <p className="text-base font-bold text-purple-900 pl-6">{medication.frequency}</p>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center text-xs text-gray-500 font-semibold uppercase">
              <CalendarDays className="w-4 h-4 mr-1.5 text-purple-900" />
              <span>Días</span>
            </div>
            <p className="text-sm font-bold text-purple-900 pl-6 leading-tight">
              {formatDays(medication.reminder_days)}
            </p>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center text-xs text-gray-500 font-semibold uppercase">
              <Clock className="w-4 h-4 mr-1.5 text-purple-900" />
              <span>Horarios</span>
            </div>
            <div className="pl-6 pt-1">
              {medication.reminder_times && medication.reminder_times.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {medication.reminder_times.sort().map((time) => (
                    <span key={time} className="inline-block bg-purple-50 text-purple-700 text-xs font-semibold px-2 py-0.5 rounded border border-purple-100">
                      {time}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">N/D</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center text-xs text-gray-500 font-semibold uppercase">
              <Calendar className="w-4 h-4 mr-1.5 text-purple-900" />
              <span>Inicio</span>
            </div>
            <p className="text-base font-bold text-purple-900 pl-6">
              {medication.start_date ? formatDate(medication.start_date) : 'N/D'}
            </p>
          </div>

          {medication.end_date && (
            <div className="space-y-1">
              <div className="flex items-center text-xs text-gray-500 font-semibold uppercase">
                <Clock className="w-4 h-4 mr-1.5 text-purple-900" />
                <span>Fin</span>
              </div>
              <p className="text-base font-bold text-purple-900 pl-6">
                {formatDate(medication.end_date)}
              </p>
            </div>
          )}
        </div>

        {(medication.prescribed_by || medication.notes) && <hr className="border-gray-100" />}
        <div className="space-y-3">
          {medication.prescribed_by && (
            <div className="flex items-center space-x-2 text-sm">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Prescrito por:</span>
              <span className="font-medium text-gray-800">
                {medication.prescribed_by}
              </span>
            </div>
          )}
        </div>
        {medication.notes && (
          <div className="border-l-4 border-purple-200 bg-purple-50 p-3 rounded-r-md">
            <p className="text-sm text-purple-800 italic leading-relaxed">{medication.notes}</p>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 p-2 flex justify-end space-x-1">
        <button
          onClick={() => onEdit(medication)}
          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-colors duration-200 cursor-pointer"
          aria-label="Editar medicamento"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(medication)}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200 cursor-pointer"
          aria-label="Eliminar medicamento"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface MedicationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData: Medication | null;
  familyMembers: FamilyMember[];
  isLoading: boolean;
}

const MedicationFormModal: React.FC<MedicationFormModalProps> = ({ isOpen, onClose, onSubmit, initialData, familyMembers, isLoading }) => {
  const [formData, setFormData] = useState({
    member_id: initialData?.member_id || '',
    name: initialData?.name || '',
    dosage: initialData?.dosage || '',
    frequency: initialData?.frequency || '',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    prescribed_by: initialData?.prescribed_by || '',
    notes: initialData?.notes || '',
  });
  const { notify } = useNotifier();


  const [reminderTimes, setReminderTimes] = useState<string[]>(initialData?.reminder_times || []);
  const [selectedDays, setSelectedDays] = useState<number[]>(initialData?.reminder_days || []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleAddTime = () => {
    setReminderTimes([...reminderTimes, "08:00"]);
  };

  const handleRemoveTime = (indexToRemove: number) => {
    setReminderTimes(reminderTimes.filter((_, index) => index !== indexToRemove));
  };

  const handleTimeChange = (indexToUpdate: number, newValue: string) => {
    const updatedTimes = reminderTimes.map((time, index) =>
      index === indexToUpdate ? newValue : time
    );
    setReminderTimes(updatedTimes);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const hasSpecificDays = selectedDays.length > 0 && selectedDays.length < 7;
    const hasNoTimes = reminderTimes.length === 0;

    if (hasSpecificDays && hasNoTimes) {
      notify("Has seleccionado días específicos pero no has configurado ninguna hora. Por favor agrega al menos una hora para recibir recordatorios.", 'error')
      return;
    }

    const submissionData = {
      ...formData,
      member_id: Number(formData.member_id),
      end_date: formData.end_date || null,
      prescribed_by: formData.prescribed_by || null,
      notes: formData.notes || null,
      reminder_times: reminderTimes.length > 0 ? reminderTimes : null,
      reminder_days: selectedDays.length === 7 ? [] : selectedDays
    };
    onSubmit(submissionData);
  };

  if (!isOpen) return null;

  const inputStyle = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col">

        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-800">
            {initialData ? 'Editar Medicamento' : 'Agregar Medicamento'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">

            <div className="lg:col-span-7 space-y-5">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Información General</h3>

              <div>
                <label htmlFor="member_id" className="block text-sm font-medium text-gray-700">Paciente</label>
                <select
                  name="member_id"
                  id="member_id"
                  value={formData.member_id}
                  onChange={handleChange}
                  required
                  disabled={!!initialData}
                  className={`${inputStyle} ${initialData ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="" disabled>Selecciona un miembro...</option>
                  {familyMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nombre del medicamento</label>
                <input type="text" name="name" id="name" placeholder="Ej. Ibuprofeno" value={formData.name} onChange={handleChange} required className={inputStyle} />
              </div>

              <div>
                <label htmlFor="dosage" className="block text-sm font-medium text-gray-700">Dosis</label>
                <input type="text" name="dosage" id="dosage" placeholder="Ej. 500mg" value={formData.dosage} onChange={handleChange} required className={inputStyle} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700">Fecha de inicio</label>
                  <input type="date" name="start_date" id="start_date" value={formData.start_date} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700">Fecha fin (opcional)</label>
                  <input type="date" name="end_date" id="end_date" value={formData.end_date} onChange={handleChange} className={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label htmlFor="prescribed_by" className="block text-sm font-medium text-gray-700">Prescrito por</label>
                  <input type="text" name="prescribed_by" id="prescribed_by" placeholder="Dr. Nombre Apellido" value={formData.prescribed_by} onChange={handleChange} className={inputStyle} />
                </div>
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notas</label>
                  <textarea name="notes" id="notes" placeholder="Instrucciones especiales..." value={formData.notes} onChange={handleChange} rows={2} className={inputStyle}></textarea>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col h-full">
              <div className="bg-purple-50 rounded-xl p-5 border border-purple-100 h-full">
                <h3 className="text-sm font-bold text-purple-900 uppercase tracking-wider mb-4 flex items-center">
                  <Clock className="w-4 h-4 mr-2" /> Planificación
                </h3>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="frequency" className="block text-sm font-medium text-purple-900 mb-1">Descripción de frecuencia</label>
                    <input
                      type="text"
                      name="frequency"
                      id="frequency"
                      placeholder="Ej. Una vez al día con comida"
                      value={formData.frequency}
                      onChange={handleChange}
                      required
                      className="block w-full px-3 py-2 border border-purple-200 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm bg-white"
                    />
                  </div>

                  <hr className="border-purple-200/60" />

                  <div>
                    <DaySelector selectedDays={selectedDays} onChange={setSelectedDays} />
                  </div>

                  <hr className="border-purple-200/60" />

                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <label className="block text-sm font-medium text-purple-900">Horarios de alerta</label>
                      <button
                        type="button"
                        onClick={handleAddTime}
                        className="text-xs bg-white border border-purple-200 text-purple-700 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors font-semibold flex items-center shadow-sm"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Agregar Hora
                      </button>
                    </div>

                    {reminderTimes.length === 0 ? (
                      <div className="text-center py-6 bg-white/50 rounded-lg border-2 border-dashed border-purple-200">
                        <p className="text-xs text-purple-400 italic">Sin alarmas configuradas.<br />Se considera "según necesidad".</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {reminderTimes.map((time, index) => (
                          <div key={index} className="flex items-center gap-1 bg-white p-1 rounded border border-purple-100 shadow-sm">
                            <input
                              type="time"
                              value={time}
                              onChange={(e) => handleTimeChange(index, e.target.value)}
                              className="block w-full px-1 py-1 text-sm border-0 focus:ring-0 text-gray-700 font-medium text-center bg-transparent"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveTime(index)}
                              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              aria-label="Eliminar hora"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end space-x-4 rounded-b-xl">
            <button type="button" onClick={onClose} disabled={isLoading} className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 font-medium shadow-sm disabled:opacity-50 transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="bg-purple-600 text-white px-6 py-2.5 rounded-lg hover:bg-purple-700 font-medium shadow-md disabled:opacity-50 flex items-center transition-all transform hover:-translate-y-0.5">
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>}
              {initialData ? 'Guardar Cambios' : 'Agregar Medicamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Medications;
