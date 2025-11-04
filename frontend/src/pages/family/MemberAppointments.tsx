import React from 'react';
import { useMemberAppointments } from '../../hooks/appointments';
import AppointmentList from '../appointments/AppointmentList';

interface MemberAppointmentsProps {
  memberId: string;
}

export const MemberAppointments: React.FC<MemberAppointmentsProps> = ({ memberId }) => {
  // Fetch appointments specifically for this member
  const { data: memberAppointments, isLoading } = useMemberAppointments(parseInt(memberId));

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <header className="p-4 border-b">
         <h3 className="text-lg font-semibold">Citas</h3>
      </header>
      <AppointmentList
        appointments={memberAppointments || []}
        isLoading={isLoading}
      />
    </div>
  );
};
