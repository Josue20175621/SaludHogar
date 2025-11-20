import asyncio
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import select, or_, and_
from sqlalchemy.orm import selectinload
from app.database import AsyncSessionLocal
from app.models import Appointment, Notification, FamilyMembership, Medication


async def find_upcoming_appointments_and_notify():
    print(f"[{datetime.now()}] corriendo check de citas")
    
    async with AsyncSessionLocal() as db:
        try:
            now = datetime.now(timezone.utc)
            reminder_window_end = now + timedelta(hours=24)

            stmt = select(Appointment).where(
                Appointment.appointment_date > now,
                Appointment.appointment_date <= reminder_window_end,
                Appointment.is_reminder_sent == False
            ).options(
                selectinload(Appointment.member),
                selectinload(Appointment.family)
            )
            
            result = await db.execute(stmt)
            appointments_to_notify = result.scalars().all()

            if not appointments_to_notify:
                print("No se encontraron nuevas citas.")
                return

            print(f"Encontre {len(appointments_to_notify)} citas que hay que recordar.")

            for appt in appointments_to_notify:
                member_name = f"{appt.member.first_name} {appt.member.last_name}"
                
                family_tz_str = appt.family.timezone or "UTC"
                local_tz = ZoneInfo(family_tz_str)

                # Convertimos la fecha UTC de la cita a la hora local de esa familia
                local_date = appt.appointment_date.astimezone(local_tz)
                
                date_str = local_date.strftime('%d/%m/%Y a las %H:%M')

                loc_text = f" en {appt.location}" if appt.location else ""
                
                message = f"Recordatorio: Cita para {member_name} el {date_str} con {appt.doctor_name}{loc_text}."

                stmt_memberships = select(FamilyMembership).where(FamilyMembership.family_id == appt.family_id)
                memberships_result = await db.execute(stmt_memberships)
                memberships = memberships_result.scalars().all()
                
                for membership in memberships:
                    new_notification = Notification(
                        user_id=membership.user_id,
                        type='APPOINTMENT_REMINDER',
                        message=message,
                        related_entity_type='appointment',
                        related_entity_id=appt.id
                    )
                    db.add(new_notification)
                    print(f"Notificando a usuario {membership.user_id} (Hora local familia: {date_str})")
                
                appt.is_reminder_sent = True
                db.add(appt)

            await db.commit()
            print("Proceso de notificaciones completado.")
        
        except Exception as e:
            await db.rollback()
            print(f"Error en find_upcoming_appointments_and_notify: {e}")
            raise

    print("Done.")

async def find_medications_and_notify():
    print(f"[{datetime.now()}] corriendo check de medicamentos...")

    async with AsyncSessionLocal() as db:
        try:
            server_now_utc = datetime.now(timezone.utc)

            stmt = select(Medication).join(Medication.family).where(
                and_(
                    Medication.start_date <= server_now_utc.date(),
                    or_(Medication.end_date == None, Medication.end_date >= server_now_utc.date()),
                    Medication.reminder_times.is_not(None) 
                )
            ).options(
                selectinload(Medication.member),
                selectinload(Medication.family)
            )

            result = await db.execute(stmt)
            medications = result.scalars().all()
            count_sent = 0

            for med in medications:
                if not med.reminder_times: 
                    continue

                fam_tz_str = med.family.timezone if med.family.timezone else "UTC"
                try:
                    family_tz = ZoneInfo(fam_tz_str)
                except:
                    family_tz = ZoneInfo("UTC")

                family_local_now = server_now_utc.astimezone(family_tz)
                
                # Python weekday(): 0=Monday, 6=Sunday
                current_weekday = family_local_now.weekday()

                if med.reminder_days and len(med.reminder_days) > 0:
                    if current_weekday not in med.reminder_days:
                        continue

                should_notify = False
                
                for time_str in med.reminder_times:
                    try:
                        target_h, target_m = map(int, time_str.split(":"))
                        
                        # Target time today in user TZ
                        target_dt_local = family_local_now.replace(
                            hour=target_h, minute=target_m, second=0, microsecond=0
                        )

                        diff_minutes = (family_local_now - target_dt_local).total_seconds() / 60

                        # Window: 0 to 5 minutes past schedule
                        if 0 <= diff_minutes <= 5:
                            should_notify = True
                            break
                    except ValueError:
                        continue

                if should_notify and med.last_reminder_sent_at:
                    time_since_last = (server_now_utc - med.last_reminder_sent_at).total_seconds() / 60
                    if time_since_last < 60:
                        should_notify = False

                if should_notify:
                    print(f"Enviando recordatorio para {med.name} a familia en TIMEZONE:{fam_tz_str}")
                    
                    stmt_memberships = select(FamilyMembership).where(FamilyMembership.family_id == med.family_id)
                    memberships_result = await db.execute(stmt_memberships)
                    memberships = memberships_result.scalars().all()
                    
                    member_name = f"{med.member.first_name} {med.member.last_name}"
                    message = f"💊 Hora de medicamento: {med.name} ({med.dosage}) para {member_name}."

                    for membership in memberships:
                        new_notification = Notification(
                            user_id=membership.user_id,
                            type='MEDICATION_REMINDER',
                            message=message,
                            related_entity_type='medication',
                            related_entity_id=med.id
                        )
                        db.add(new_notification)

                    med.last_reminder_sent_at = server_now_utc
                    db.add(med)
                    count_sent += 1

            await db.commit()
            print(f"Medicamentos revisados. Se enviaron {count_sent} recordatorios.")

        except Exception as e:
            await db.rollback()
            print(f"Error en find_medications_and_notify: {e}")

async def main():
    await find_upcoming_appointments_and_notify()
    await find_medications_and_notify()

if __name__ == "__main__":
    asyncio.run(main())