import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';

import type { AppContextType } from '../../App';
import { calculateAge, formatDate } from '../../utils/formatters';

const FamilyMembers: React.FC = () => {
  const { familyMembers } = useOutletContext<AppContextType>();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Family Members</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Member</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {familyMembers.map(member => (
          <div key={member.id} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{member.first_name} {member.last_name}</h3>
                <p className="text-gray-600">{member.relation}</p>
              </div>
              <div className="flex space-x-2">
                <button className="p-2 text-gray-400 hover:text-blue-600" aria-label={`Edit ${member.first_name}`}>
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600" aria-label={`Delete ${member.first_name}`}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Age:</span> {calculateAge(member.birth_date)} years</p>
              <p><span className="font-medium">Gender:</span> {member.gender}</p>
              <p><span className="font-medium">Birth Date:</span> {formatDate(member.birth_date)}</p>
              <p><span className="font-medium">Blood type:</span> {member.blood_type}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FamilyMembers;