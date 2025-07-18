from babel.dates import format_datetime
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from datetime import datetime

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import black, red, blue, darkgreen
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.lib import colors
from io import BytesIO

from app.database import get_db
from app.family.dependencies import get_target_member
from app.models import (
    FamilyMember, Appointment, Medication, Vaccination, 
    Allergy, Condition, Surgery, Hospitalization, 
    FamilyHistoryCondition
)

from app.schemas import (
    AppointmentOut,
    FamilyMemberOut,
    AllergyOut,
    MedicationOut,
    VaccinationOut,
    ConditionOut,
    SurgeryOut,
    HospitalizationOut,
    FamilyHistoryConditionOut,
    MedicalReport,
)


router = APIRouter(
    prefix="/families/{family_id}/members/{member_id}",
    tags=["Member Health Records"]
)

@router.get("/appointments", response_model=List[AppointmentOut])
async def get_member_appointments(
    # This dependency will automatically get the member from the URL
    # and validate their ownership.
    target_member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all appointments for a specific family member.
    """
    stmt = select(Appointment).where(
        Appointment.member_id == target_member.id
    ).order_by(Appointment.appointment_date.desc())
    
    result = await db.execute(stmt)
    appointments = result.scalars().all()
    return appointments


@router.get("/medications", response_model=List[MedicationOut])
async def get_member_medications(
    target_member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all medications for a specific family member.
    """
    stmt = select(Medication).where(
        Medication.member_id == target_member.id
    ).order_by(Medication.start_date.desc())
    
    result = await db.execute(stmt)
    medications = result.scalars().all()
    return medications

@router.get("/vaccinations", response_model=List[VaccinationOut])
async def get_member_vaccinations(
    target_member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all vaccinations for a specific family member.
    """
    stmt = select(Vaccination).where(
        Vaccination.member_id == target_member.id
    ).order_by(Vaccination.date_administered.desc())
    
    result = await db.execute(stmt)
    vaccinations = result.scalars().all()
    return vaccinations

@router.get("/medical-report", response_model=MedicalReport)
async def generate_medical_report(
    target_member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a comprehensive medical report for a specific family member.
    
    This report includes:
    - Personal Information (Tier 1)
    - Allergies (Tier 1) 
    - Current Medications (Tier 1)
    - Vaccination History (Tier 1)
    - Chronic Medical Conditions (Tier 2)
    - Surgical History (Tier 2)
    - Hospitalizations (Tier 2)
    - Family Medical History (Tier 3)
    - Social History (Tier 3)
    """
    stmts = {
        "allergies": select(Allergy).where(Allergy.member_id == target_member.id),
        "medications": select(Medication).where(Medication.member_id == target_member.id),
        "vaccinations": select(Vaccination)
            .where(Vaccination.member_id == target_member.id)
            .order_by(Vaccination.date_administered.desc()),
        "conditions": select(Condition).where(Condition.member_id == target_member.id),
        "surgeries": select(Surgery)
            .where(Surgery.member_id == target_member.id)
            .order_by(Surgery.date_of_procedure.desc()),
        "hospitalizations": select(Hospitalization)
            .where(Hospitalization.member_id == target_member.id)
            .order_by(Hospitalization.admission_date.desc()),
        "family_history": select(FamilyHistoryCondition)
            .where(FamilyHistoryCondition.family_id == target_member.family_id),
    }

    results = {}
    for key, stmt in stmts.items():
        res = await db.execute(stmt)
        results[key] = res.scalars().all()

    member_out = FamilyMemberOut.model_validate(target_member)

    allergies = [AllergyOut.model_validate(a) for a in results["allergies"]]
    medications = [MedicationOut.model_validate(m) for m in results["medications"]]
    vaccinations = [VaccinationOut.model_validate(v) for v in results["vaccinations"]]
    conditions = [ConditionOut.model_validate(c) for c in results["conditions"]]
    surgeries = [SurgeryOut.model_validate(s) for s in results["surgeries"]]
    hospitalizations = [
        HospitalizationOut.model_validate(h) for h in results["hospitalizations"]
    ]
    family_history = [
        FamilyHistoryConditionOut.model_validate(fh)
        for fh in results["family_history"]
    ]

    return MedicalReport(
        personal_information=member_out,
        allergies=allergies,
        current_medications=medications,
        vaccination_history=vaccinations,
        chronic_conditions=conditions,
        surgical_history=surgeries,
        hospitalizations=hospitalizations,
        family_medical_history=family_history,
        report_generated_at=datetime.now(),
    )

@router.get("/medical-report/pdf")
async def generate_medical_report_pdf(
    target_member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db),
):
    """
    Generate a PDF version of the medical report,
    streaming the bytes back with Content-Disposition.
    """
    report = await generate_medical_report(target_member, db)

    # --- build PDF in memory ---
    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "Title",
        parent=styles["Heading1"],
        fontSize=20,
        alignment=TA_CENTER,
        textColor=colors.darkgreen,
        spaceAfter=12,
    )
    section_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontSize=14,
        textColor=colors.blue,
        spaceBefore=18,
        spaceAfter=6,
    )
    normal = styles["Normal"]

    spanish_date = format_datetime( report.report_generated_at,  "d 'de' MMMM 'de' y 'a las' h:mm a", locale='es')
    elems = []
    elems.append(Paragraph("INFORME MÉDICO", title_style))
    elems.append(Spacer(1, 12))
    elems.append(
        Paragraph(
            f"Generado el: {spanish_date}",
            normal,
        )
    )
    elems.append(Spacer(1, 24))

    # Información Personal
    pi = report.personal_information
    elems.append(Paragraph("INFORMACIÓN PERSONAL", section_style))
    data = [
        ["Nombre completo:", f"{pi.first_name} {pi.last_name}"],
        ["Fecha de nacimiento:", str(pi.birth_date) if pi.birth_date else "—"],
        ["Género:", pi.gender or "—"],
        ["Parentesco:", pi.relation or "—"],
        ["Tipo de sangre:", pi.blood_type or "—"],
        ["Teléfono:", pi.phone_number or "—"],
    ]
    tbl = Table(data)
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        )
    )
    elems.append(tbl)

    elems.append(Spacer(1, 24))

    # Sección de Historial Social
    elems.append(Paragraph("HISTORIAL SOCIAL", section_style))

    social_data = [
        ["Uso de Tabaco:", pi.tobacco_use or "No especificado"],
        ["Consumo de Alcohol:", pi.alcohol_use or "No especificado"],
        ["Ocupación:", pi.occupation or "No especificado"]
    ]

    social_table = Table(social_data)
    social_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 0), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    elems.append(social_table)

    elems.append(Spacer(1, 24))

    # Alergias
    elems.append(Paragraph(f"ALERGIAS ({len(report.allergies)})", section_style))
    if report.allergies:
        data = [["Categoría", "Alergeno", "Reacción", "¿Grave?"]]
        for a in report.allergies:
            data.append(
                [
                    a.category,
                    a.name,
                    a.reaction or "—",
                    "Sí" if a.is_severe else "No",
                ]
            )
        tbl = Table(data)
        tbl.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.black),
                ]
            )
        )
        elems.append(tbl)
    else:
        elems.append(Paragraph("No hay alergias registradas.", normal))
    elems.append(Spacer(1, 24))
    
    # Current Medications Section
    elems.append(Paragraph(f"MEDICAMENTOS ACTUALES ({len(report.current_medications)} en total)", section_style))

    if report.current_medications:
        med_data = [["Medicamento", "Dosis", "Frecuencia", "Prescrito por"]]
        for med in report.current_medications:
            med_data.append([
                med.name,
                med.dosage,
                med.frequency,
                med.prescribed_by or "No especificado"
            ])
        
        med_table = Table(med_data)
        med_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elems.append(med_table)
    else:
        elems.append(Paragraph("No hay medicamentos actuales registrados.", normal))

    # Sección de Historial de Vacunación
    elems.append(Paragraph(f"HISTORIAL DE VACUNACIÓN ({len(report.vaccination_history)} en total)", section_style))

    if report.vaccination_history:
        vax_data = [["Vacuna", "Fecha de Administración", "Administrado Por"]]
        for vax in report.vaccination_history:
            vax_data.append([
                vax.vaccine_name,
                str(vax.date_administered),
                vax.administered_by or "No especificado"
            ])
        
        vax_table = Table(vax_data)
        vax_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elems.append(vax_table)
    else:
        elems.append(Paragraph("No hay registros de vacunación en el archivo.", normal))

    elems.append(Spacer(1, 20))

    # Sección de Condiciones
    elems.append(Paragraph(f"CONDICIONES ({len(report.chronic_conditions)} en total)", section_style))
    """
    styles = getSampleStyleSheet()
    table_cell_style = styles["Normal"]
    table_cell_style.fontSize = 9
    table_cell_style.leading = 11
    """

    if report.chronic_conditions:
        condition_data = [["Condición", "Fecha de Diagnóstico", "Estado", "Notas"]]
        for condition in report.chronic_conditions:
            status = "Activa" if condition.is_active else "Inactiva"
            
            condition_data.append([
                condition.name,
                str(condition.date_diagnosed),
                status,
                condition.notes or "Ninguna"
            ])
            """
            condition_data.append([
                Paragraph(condition.name, table_cell_style),
                Paragraph(str(condition.date_diagnosed), table_cell_style),
                Paragraph(status, table_cell_style),
                Paragraph(condition.notes or "Ninguna", table_cell_style)
            ])
            """
        
        condition_table = Table(condition_data)
        condition_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elems.append(condition_table)
    else:
        elems.append(Paragraph("No hay condiciones registradas.", normal))

    elems.append(Spacer(1, 20))

    # Sección de Historial Quirúrgico
    elems.append(Paragraph(f"HISTORIAL QUIRÚRGICO ({len(report.surgical_history)} en total)", section_style))

    if report.surgical_history:
        surgery_data = [["Procedimiento", "Fecha", "Cirujano", "Centro Médico"]]
        for surgery in report.surgical_history:
            surgery_data.append([
                surgery.name,
                str(surgery.date_of_procedure),
                surgery.surgeon_name or "No especificado",
                surgery.facility_name or "No especificado"
            ])
        
        surgery_table = Table(surgery_data)
        surgery_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elems.append(surgery_table)
    else:
        elems.append(Paragraph("No hay historial quirúrgico registrado.", normal))

    elems.append(Spacer(1, 20))

    # Sección de Hospitalizaciones
    elems.append(Paragraph(f"HOSPITALIZACIONES ({len(report.hospitalizations)} en total)", section_style))

    if report.hospitalizations:
        hosp_data = [["Motivo", "Fecha de Ingreso", "Fecha de Alta", "Centro Médico"]]
        for hosp in report.hospitalizations:
            hosp_data.append([
                hosp.reason,
                str(hosp.admission_date),
                str(hosp.discharge_date) if hosp.discharge_date else "No especificado",
                hosp.facility_name or "No especificado"
            ])
        
        hosp_table = Table(hosp_data)
        hosp_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elems.append(hosp_table)
    else:
        elems.append(Paragraph("No hay registros de hospitalización en el archivo.", normal))

    elems.append(Spacer(1, 20))

    # Sección de Historial Médico Familiar
    elems.append(Paragraph(f"HISTORIAL MÉDICO FAMILIAR ({len(report.family_medical_history)} en total)", section_style))

    if report.family_medical_history:
        fh_data = [["Condición", "Pariente", "Notas"]]
        for fh in report.family_medical_history:
            fh_data.append([
                fh.condition_name,
                fh.relative,
                fh.notes or "Ninguna"
            ])
        
        fh_table = Table(fh_data)
        fh_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elems.append(fh_table)
    else:
        elems.append(Paragraph("No hay historial médico familiar registrado.", normal))

    elems.append(Spacer(1, 20))

    # Build and stream
    doc.build(elems)
    buf.seek(0)

    fn = f"informe_medico_{pi.first_name}_{pi.last_name}_{datetime.now():%Y%m%d}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{fn}"'},
    )
