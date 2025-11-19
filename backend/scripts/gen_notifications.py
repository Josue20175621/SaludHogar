import asyncio
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv
from zoneinfo import ZoneInfo

env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(env_path)

from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload
from app.database import AsyncSessionLocal, engine
from app.models import Appointment, Notification, FamilyMembership, Medication, Family
from app.security import encryption
from babel.dates import format_datetime

async def find_upcoming_appointments_and_notify():
    print(f"[{datetime.now()}] corriendo check de citas (REDACTED)")
    
    # This is a simple in-memory cache to avoid decrypting the same key multiple times.
    plaintext_deks_cache = {}

    async with AsyncSessionLocal() as db:
        try:
            now = datetime.now(timezone.utc)
            reminder_window_end = now + timedelta(hours=24)

            # EFFICIENT QUERY
            # Eagerly load all relationships we will need to avoid lazy-loading errors.
            stmt = select(Appointment).where(
                Appointment.appointment_date > now,
                Appointment.appointment_date <= reminder_window_end,
                Appointment.is_reminder_sent == False
            ).options(
                joinedload(Appointment.member),
                joinedload(Appointment.family).joinedload(Family.encryption_key)
            )
            
            appointments_to_notify = (await db.scalars(stmt)).all()

            if not appointments_to_notify:
                return

            print(f"Found {len(appointments_to_notify)} appointments to remind.")

            for appt in appointments_to_notify:
                family_id = appt.family_id
                
                # Get the DEK for this family, using the cache for efficiency.
                if family_id not in plaintext_deks_cache:
                    if not appt.family or not appt.family.encryption_key:
                        print(f"Saltando cita {appt.id}: falta la familia o la clave de cifrado.")
                        continue
                    encrypted_dek = appt.family.encryption_key.encrypted_dek
                    plaintext_deks_cache[family_id] = encryption.decrypt_dek(encrypted_dek)
                
                plaintext_dek = plaintext_deks_cache[family_id]

                appt._plaintext_dek = plaintext_dek
                appt.member._plaintext_dek = plaintext_dek
                
                member_name = f"{appt.member.first_name} {appt.member.last_name}"
                doctor_name = appt.doctor_name
                location = appt.location
                
                local_appt_time = appt.appointment_date.astimezone() # Convert to local timezone
                date_str = format_datetime(local_appt_time, "EEEE, d 'de' MMMM 'a las' h:mm a", locale='es')
                message = f"Recordatorio: Cita para {member_name} con {doctor_name} el {date_str}"
                if location:
                    message += f" en {location}."
                else:
                    message += "."

                # Find all users in the family to notify them.
                memberships = (await db.scalars(select(FamilyMembership).where(FamilyMembership.family_id == family_id))).all()
                for membership in memberships:
                    new_notification = Notification(
                        user_id=membership.user_id,
                        type='APPOINTMENT_REMINDER',
                        related_entity_type='appointment',
                        related_entity_id=appt.id
                    )
                    # HYDRATE the new notification before setting its message
                    new_notification._plaintext_dek = plaintext_dek
                    new_notification.message = message
                    
                    db.add(new_notification)
                    print(f"Creando notificacion para usuario {membership.user_id}")
                
                appt.is_reminder_sent = True
                db.add(appt)

            await db.commit()
        
        except Exception as e:
            await db.rollback()
            print(f"ERROR en find_upcoming_appointments_and_notify: {e}")
            raise

async def find_medication_reminders_and_notify():
    print(f"[{datetime.now()}] corriendo check de medicamentos (REDACTED)...")
    
    plaintext_deks_cache = {}

    async with AsyncSessionLocal() as db:
        try:
            server_now_utc = datetime.now(timezone.utc)
            today = server_now_utc.date()

            # Select active medications that have reminder_times set
            # We eager load the Family and Encryption Key to handle the DEK later
            stmt = select(Medication).where(
                Medication.start_date <= today,
                (Medication.end_date == None) | (Medication.end_date >= today),
                Medication.reminder_times.is_not(None)
            ).options(
                joinedload(Medication.member),
                joinedload(Medication.family).joinedload(Family.encryption_key)
            )

            medications = (await db.scalars(stmt)).all()
            
            if not medications: return

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
                
                # check Days (0=Monday, 6=Sunday)
                if med.reminder_days and len(med.reminder_days) > 0:
                    current_weekday = family_local_now.weekday()
                    if current_weekday not in med.reminder_days:
                        continue

                should_notify = False
                
                for time_str in med.reminder_times:
                    try:
                        target_h, target_m = map(int, time_str.split(":"))
                        
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
                    family_id = med.family_id
                    
                    if family_id not in plaintext_deks_cache:
                        if not med.family or not med.family.encryption_key:
                            print(f"Saltando el medicamento {med.id}: falta la familia o la clave de cifrado.")
                            continue
                        encrypted_dek = med.family.encryption_key.encrypted_dek
                        plaintext_deks_cache[family_id] = encryption.decrypt_dek(encrypted_dek)
                    
                    plaintext_dek = plaintext_deks_cache[family_id]
                    
                    # Inject DEK into models to allow property access
                    med._plaintext_dek = plaintext_dek
                    med.member._plaintext_dek = plaintext_dek
                    
                    try:
                        # Access encrypted properties
                        member_name = f"{med.member.first_name} {med.member.last_name}"
                        med_name = med.name
                        dosage_str = med.dosage
                        
                        message = f"💊 Hora de medicamento: {med_name} ({dosage_str}) para {member_name}."
                        
                        # Find all family members to notify
                        memberships = (await db.scalars(select(FamilyMembership).where(FamilyMembership.family_id == family_id))).all()
                        
                        for membership in memberships:
                            new_notification = Notification(
                                user_id=membership.user_id,
                                type='MEDICATION_REMINDER',
                                related_entity_type='medication',
                                related_entity_id=med.id
                            )
                            # Inject DEK into notification if it encrypts its message
                            new_notification._plaintext_dek = plaintext_dek 
                            new_notification.message = message
                            
                            db.add(new_notification)

                        # Update last sent time
                        med.last_reminder_sent_at = server_now_utc
                        db.add(med)
                        count_sent += 1
                        
                    except Exception as decrypt_err:
                        print(f"Error al descifrar los datos para el medicamento {med.id}: {decrypt_err}")
                        continue

            await db.commit()
            if count_sent > 0:
                print(f"{count_sent} recordatorios de medicamentos creados")

        except Exception as e:
            await db.rollback()
            print(f"ERROR en find_medication_reminders_and_notify: {e}")
            raise

if __name__ == "__main__":
    async def main():
        try:
            await asyncio.gather(
                find_upcoming_appointments_and_notify(),
                find_medication_reminders_and_notify(),
            )
        finally:
            await engine.dispose()

    asyncio.run(main())