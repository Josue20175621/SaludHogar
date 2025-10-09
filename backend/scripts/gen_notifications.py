import sys
import os
import asyncio
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.database import AsyncSessionLocal
from app.models import Appointment, Notification, FamilyMembership

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


async def find_upcoming_appointments_and_notify():
    print(f"[{datetime.now()}] corriendo check de citas")
    
    async with AsyncSessionLocal() as db:
        try:
            # Get the current time in UTC
            now = datetime.now(timezone.utc)
            
            reminder_window_end = now + timedelta(hours=24)

            stmt = select(Appointment).where(
                Appointment.appointment_date > now,
                Appointment.appointment_date <= reminder_window_end,
                Appointment.is_reminder_sent == False
            ).options(
                selectinload(Appointment.member) # Eager load for the message content
            )
            
            result = await db.execute(stmt)
            appointments_to_notify = result.scalars().all()

            if not appointments_to_notify:
                print("No se encontraron nuevas citas para notificar en las próximas 24 horas.")
                await db.commit()
                return

            print(f"Encontre {len(appointments_to_notify)} citas que hay que recordar.")

            for appt in appointments_to_notify:
                # Get all users in the family to send them a notification
                stmt_memberships = select(FamilyMembership).where(FamilyMembership.family_id == appt.family_id)
                memberships_result = await db.execute(stmt_memberships)
                memberships = memberships_result.scalars().all()
                
                for membership in memberships:
                    member_name = f"{appt.member.first_name} {appt.member.last_name}"
                    appt_time_local = appt.appointment_date # This will be in UTC
                    
                    message = f"Recordatorio: Cita para {member_name} con {appt.doctor_name} pronto."

                    new_notification = Notification(
                        user_id=membership.user_id,
                        type='APPOINTMENT_REMINDER',
                        message=message,
                        related_entity_type='appointment',
                        related_entity_id=appt.id
                    )
                    db.add(new_notification)
                    print(f"  - Creando notificacion para usuario {membership.user_id} para cita {appt.id}")
                
                # Mark this appointment as notified to prevent future duplicates.
                appt.is_reminder_sent = True
                db.add(appt)

            await db.commit()
            print("Se creo la notificacion y se marco is_reminder_sent.")
        
        except Exception as e:
            await db.rollback()
            print(f"Error en find_upcoming_appointments_and_notify: {e}")
            raise

    print("Recordatorio de cita completo.")


async def main():
    await find_upcoming_appointments_and_notify()

if __name__ == "__main__":
    asyncio.run(main())