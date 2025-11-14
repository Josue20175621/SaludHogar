import asyncio
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(env_path)

from sqlalchemy import select
from sqlalchemy.orm import joinedload
from app.database import AsyncSessionLocal, engine
from app.models import Appointment, Notification, FamilyMembership, Medication, Family
from app.security import encryption
from babel.dates import format_datetime

async def find_upcoming_appointments_and_notify():
    print(f"[{datetime.now()}] Running appointment reminder check...")
    
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
                print("No new appointments found to notify.")
                return

            print(f"Found {len(appointments_to_notify)} appointments to remind.")

            for appt in appointments_to_notify:
                family_id = appt.family_id
                
                # Get the DEK for this family, using the cache for efficiency.
                if family_id not in plaintext_deks_cache:
                    if not appt.family or not appt.family.encryption_key:
                        print(f"Skipping appointment {appt.id}: Missing family or encryption key.")
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
                    print(f"Creating notification for user {membership.user_id} for appointment {appt.id}")
                
                appt.is_reminder_sent = True
                db.add(appt)

            await db.commit()
            print("Appointment notifications created and marked as sent.")
        
        except Exception as e:
            await db.rollback()
            print(f"ERROR in find_upcoming_appointments_and_notify: {e}")
            raise

async def find_medication_reminders_and_notify():
    print(f"[{datetime.now()}] Running medication reminder check...")
    
    plaintext_deks_cache = {}

    async with AsyncSessionLocal() as db:
        try:
            today = datetime.now(timezone.utc).date()

            # Find all active medications
            stmt = select(Medication).where(
                Medication.start_date <= today,
                (Medication.end_date == None) | (Medication.end_date >= today)
            ).options(
                joinedload(Medication.member),
                joinedload(Medication.family).joinedload(Family.encryption_key)
            )

            medications_to_notify = (await db.scalars(stmt)).all()

            if not medications_to_notify:
                print("No active medications found to notify.")
                return
            
            print(f"Found {len(medications_to_notify)} active medications to remind.")

            for med in medications_to_notify:
                family_id = med.family_id
                
                if family_id not in plaintext_deks_cache:
                    if not med.family or not med.family.encryption_key:
                        print(f"Skipping medication {med.id}: Missing family or encryption key.")
                        continue
                    encrypted_dek = med.family.encryption_key.encrypted_dek
                    plaintext_deks_cache[family_id] = encryption.decrypt_dek(encrypted_dek)
                
                plaintext_dek = plaintext_deks_cache[family_id]
                
                med._plaintext_dek = plaintext_dek
                med.member._plaintext_dek = plaintext_dek
                
                member_name = f"{med.member.first_name} {med.member.last_name}"
                med_name = med.name
                message = f"Recordatorio de medicación: Es hora de que {member_name} tome su dosis de {med_name} ({med.dosage})."

                memberships = (await db.scalars(select(FamilyMembership).where(FamilyMembership.family_id == family_id))).all()
                for membership in memberships:
                    new_notification = Notification(
                        user_id=membership.user_id,
                        type='MEDICATION_REMINDER',
                        related_entity_type='medication',
                        related_entity_id=med.id
                    )
                    new_notification._plaintext_dek = plaintext_dek
                    new_notification.message = message
                    db.add(new_notification)
                    print(f"Creating medication reminder for user {membership.user_id} for medication {med.id}")

            await db.commit()
            print("Medication notifications created.")

        except Exception as e:
            await db.rollback()
            print(f"ERROR in find_medication_reminders_and_notify: {e}")
            raise

async def main():
    try:
        # Run both tasks concurrently
        await asyncio.gather(
            find_upcoming_appointments_and_notify(),
        )
    finally:
        # Ensure the database connection pool is closed
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())