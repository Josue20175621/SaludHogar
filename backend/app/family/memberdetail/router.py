from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import mimetypes
from pathlib import Path
from datetime import datetime
import os

from io import BytesIO
from babel.dates import format_date, format_datetime

from reportlab.platypus import (
    Paragraph,
    Spacer,
    Image,
    Table,
    TableStyle,
    BaseDocTemplate,
    Frame,
    PageTemplate,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.pagesizes import A4

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

BASE_DIR = (Path(__file__).resolve().parents[2] / "images" / "profile").resolve()

router = APIRouter(
    prefix="/families/{family_id}/members/{member_id}",
    tags=["Member Health Records"]
)

def _resolve_member_photo(member: FamilyMember) -> Path | None:
    rel = getattr(member, "profile_image_relpath", None)
    if rel:
        candidate = (BASE_DIR / rel).resolve()
        try:
            candidate.relative_to(BASE_DIR)  # path traversal guard
        except ValueError:
            return None
        return candidate if candidate.is_file() else None

@router.get("/photo")
async def serve_member_photo(member: FamilyMember = Depends(get_target_member)):
    file_path = _resolve_member_photo(member)
    if not file_path: raise HTTPException(status_code=404, detail="Image not found")
    
    media_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    headers = {"Cache-Control": "private, max-age=86400"}
    return FileResponse(file_path, media_type=media_type, headers=headers)



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

def fmt_date(d): return d.strftime('%d/%m/%Y') if d else "—"

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

class MedicalReportStyler:
    
    # Paleta de Colores 
    PRIMARY_COLOR = colors.HexColor("#0d6efd")
    SECONDARY_COLOR = colors.HexColor("#6c757d")
    BACKGROUND_COLOR = colors.HexColor("#f8f9fa")
    TEXT_COLOR = colors.HexColor("#212529")
    HEADER_TEXT_COLOR = colors.white
    BORDER_COLOR = colors.HexColor("#dee2e6")
    DANGER_COLOR = colors.HexColor("#dc3545")

    def __init__(self, assets_path="assets"):
        self.assets_path = assets_path
        self.styles = self._create_styles()

    def _get_asset_path(self, asset_name: str) -> str:
        path = os.path.join(self.assets_path, asset_name) # Esperemos que exista ese asset
        return path
        
    def _create_styles(self) -> dict:
        styles = getSampleStyleSheet()
        
        base_style = dict(textColor=self.TEXT_COLOR, fontName="Helvetica")
        
        return {
            "Title": ParagraphStyle("Title", parent=styles["h1"], fontSize=22, alignment=TA_CENTER, textColor=self.PRIMARY_COLOR, spaceAfter=20),
            "Normal": ParagraphStyle("Normal", parent=styles["Normal"], **base_style),
            "NormalRight": ParagraphStyle("NormalRight", parent=styles["Normal"], alignment=TA_LEFT, **base_style),
            "TableHeader": ParagraphStyle("TableHeader", parent=styles["Normal"], textColor=self.HEADER_TEXT_COLOR, fontName="Helvetica-Bold"),
            "TableCell": ParagraphStyle("TableCell", parent=styles["Normal"], **base_style),
            "SectionHeader": ParagraphStyle("SectionHeader", parent=styles["h2"], fontSize=14, textColor=self.PRIMARY_COLOR, fontName="Helvetica-Bold"),
        }

    def header_footer(self, canvas, doc):
        canvas.saveState()
        
        page_width, page_height = doc.pagesize

        # Encabezado 
        header_y_position = page_height - 0.5 * inch

        header_text = Paragraph("Informe Médico Confidencial", self.styles["NormalRight"])
        w, h = header_text.wrap(doc.width, doc.topMargin)
        header_text.drawOn(canvas, doc.leftMargin, header_y_position - h)

        line_y_position = page_height - 0.7 * inch
        canvas.setStrokeColor(self.BORDER_COLOR)
        canvas.line(doc.leftMargin, line_y_position, doc.leftMargin + doc.width, line_y_position)

        footer_text = Paragraph(f"Página {doc.page}", self.styles["Normal"])
        w, h = footer_text.wrap(doc.width, doc.bottomMargin)
        footer_text.drawOn(canvas, doc.leftMargin, 0.5 * inch)
        
        canvas.restoreState()

    def create_section_header(self, title: str, icon_name: str) -> Table:
        icon_path = self._get_asset_path(f"icons/{icon_name}")
        icon = Image(icon_path, width=0.25 * inch, height=0.25 * inch)
        
        title_p = Paragraph(title, self.styles["SectionHeader"])
        
        return Table([[icon, title_p]], colWidths=[0.4 * inch, None], style=[('VALIGN', (0, 0), (-1, -1), 'MIDDLE')])

    def create_data_table(self, headers: list, data: list, col_widths=None) -> Table:
        header_ps = [Paragraph(h, self.styles["TableHeader"]) for h in headers]
        data_ps = [
            [Paragraph(str(cell), self.styles["TableCell"]) for cell in row]
            for row in data
        ]
        
        table_data = [header_ps] + data_ps
        
        tbl = Table(table_data, colWidths=col_widths)
        tbl.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.PRIMARY_COLOR),
            ('GRID', (0, 0), (-1, -1), 1, self.BORDER_COLOR),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, self.BACKGROUND_COLOR]),
        ]))
        return tbl
        
    def create_info_card(self, header: Table, content_flowable) -> Table:
        card_content = [
            [header],
            [content_flowable]
        ]
        
        return Table(
            card_content, 
            style=[
                ('BOX', (0, 0), (-1, -1), 1, self.BORDER_COLOR),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                ('TOPPADDING', (0, 1), (-1, -1), 10) 
            ], 
            spaceBefore=15, 
            colWidths=['100%'],
            splitByRow=0
        )

@router.get("/medical-report/pdf")
async def generate_medical_report_pdf(
    target_member: FamilyMember = Depends(get_target_member),
    db: AsyncSession = Depends(get_db),
):
    """
    Genera una versión en PDF del informe médico con un diseño mejorado.
    """
    report = await generate_medical_report(target_member, db)
    
    buf = BytesIO()
    styler = MedicalReportStyler()

    doc = BaseDocTemplate(buf, pagesize=A4, rightMargin=inch, leftMargin=inch, topMargin=inch, bottomMargin=inch)
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='normal')
    template = PageTemplate(id='main', frames=frame, onPage=styler.header_footer)
    doc.addPageTemplates([template])

    elems = []
    
    # Título e Información General
    elems.append(Paragraph("Informe Médico", styler.styles["Title"]))
    spanish_date = format_datetime(report.report_generated_at, "d 'de' MMMM 'de' y 'a las' h:mm a", locale='es')
    elems.append(Paragraph(f"<b>Fecha de generación:</b> {spanish_date}", styler.styles["Normal"]))
    elems.append(Spacer(1, 0.3 * inch))

    # Sección: Información Personal y Social
    pi = report.personal_information
    header = styler.create_section_header("Información del Paciente", "user.png")
    
    text_data_list = [
        [Paragraph("<b>Nombre completo:</b>", styler.styles["Normal"]), Paragraph(f"{pi.first_name} {pi.last_name}", styler.styles["Normal"])],
        [Paragraph("<b>Fecha de nacimiento:</b>", styler.styles["Normal"]), Paragraph(format_date(pi.birth_date, "d 'de' MMMM 'de' y", locale='es') if pi.birth_date else "—", styler.styles["Normal"])],
        [Paragraph("<b>Género:</b>", styler.styles["Normal"]), Paragraph(pi.gender or "—", styler.styles["Normal"])],
        [Paragraph("<b>Tipo de sangre:</b>", styler.styles["Normal"]), Paragraph(pi.blood_type or "—", styler.styles["Normal"])],
        [Paragraph("<b>Uso de Tabaco:</b>", styler.styles["Normal"]), Paragraph(pi.tobacco_use or "—", styler.styles["Normal"])],
        [Paragraph("<b>Consumo de Alcohol:</b>", styler.styles["Normal"]), Paragraph(pi.alcohol_use or "—", styler.styles["Normal"])],
        [Paragraph("<b>Ocupación:</b>", styler.styles["Normal"]), Paragraph(pi.occupation or "—", styler.styles["Normal"])],
    ]
    text_data_table = Table(text_data_list, colWidths=['35%', '65%'], style=[('VALIGN', (0,0), (-1,-1), 'TOP'), ('LEFTPADDING', (0,0), (-1,-1), 0)])

    profile_pic_path = _resolve_member_photo(target_member)
    content = None

    if profile_pic_path:
        profile_image = Image(profile_pic_path, width=1.1*inch, height=1.1*inch)
        profile_image.hAlign = 'CENTER'
        
        content = Table(
            [[text_data_table, profile_image]],
            colWidths=['*', 1.3 * inch],
            style=[
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('VALIGN', (0,1), (0,1), 'MIDDLE') 
            ]
        )
    else:
        content = text_data_table
    
    elems.append(styler.create_info_card(header, content))

    # Seccion: Alergias
    if report.allergies:
        header = styler.create_section_header(f"Alergias", "allergy.png")
        headers = ["Alérgeno", "Reacción", "Gravedad"]
        data = []
        for a in report.allergies:
            severity = f"<font color='{styler.DANGER_COLOR.hexval()}'><b>Grave</b></font>" if a.is_severe else "Leve"
            data.append([f"<b>{a.name}</b><br/>({a.category})", a.reaction or "—", severity])
        content = styler.create_data_table(headers, data, col_widths=['35%', '45%', '20%'])
        elems.append(styler.create_info_card(header, content))
        
    # Seccion: Medicamentos Actuales
    if report.current_medications:
        header = styler.create_section_header("Medicamentos Actuales", "medication.png")
        headers = ["Medicamento", "Dosis y Frecuencia", "Prescrito por"]
        data = [[m.name, f"{m.dosage} - {m.frequency}", m.prescribed_by or "—"] for m in report.current_medications]
        content = styler.create_data_table(headers, data)
        elems.append(styler.create_info_card(header, content))

    # Seccion: Historial de Vacunación
    if report.vaccination_history:
        header = styler.create_section_header("Historial de Vacunación", "vaccine.png")
        headers = ["Vacuna", "Fecha", "Administrado por"]
        data = [[v.vaccine_name, fmt_date(v.date_administered), v.administered_by or "—"] for v in report.vaccination_history]
        content = styler.create_data_table(headers, data)
        elems.append(styler.create_info_card(header, content))

    # Seccion: Condiciones Crónicas
    if report.chronic_conditions:
        header = styler.create_section_header("Condiciones Médicas", "condition.png")
        headers = ["Condición", "Diagnóstico", "Estado", "Notas"]
        data = []
        for c in report.chronic_conditions:
            status = "Activa" if c.is_active else "Inactiva"
            data.append([c.name, fmt_date(c.date_diagnosed), status, c.notes or "—"])
        content = styler.create_data_table(headers, data, col_widths=['25%', '15%', '15%', '45%'])
        elems.append(styler.create_info_card(header, content))

    # Seccion: Historial Quirúrgico
    if report.surgical_history:
        header = styler.create_section_header("Historial Quirúrgico", "surgery.png")
        headers = ["Procedimiento", "Fecha", "Cirujano", "Centro Médico"]
        data = [
            [
                s.name,
                fmt_date(s.date_of_procedure),
                s.surgeon_name or "—",
                s.facility_name or "—"
            ] for s in report.surgical_history
        ]
        content = styler.create_data_table(headers, data, col_widths=['40%', '20%', '20%', '20%'])
        elems.append(styler.create_info_card(header, content))

    # Seccion: Hospitalizaciones
    if report.hospitalizations:
        header = styler.create_section_header("Hospitalizaciones", "hospital.png")
        headers = ["Motivo", "Fecha de Ingreso", "Fecha de Alta", "Centro Médico"]
        data = [
            [
                h.reason,
                fmt_date(h.admission_date),
                fmt_date(h.discharge_date),
                h.facility_name or "—"
            ] for h in report.hospitalizations
        ]
        content = styler.create_data_table(headers, data, col_widths=['40%', '20%', '20%', '20%'])
        elems.append(styler.create_info_card(header, content))

    # Seccion: Historial Médico Familiar
    if report.family_medical_history:
        header = styler.create_section_header("Historial Médico Familiar", "family.png")
        headers = ["Condición", "Pariente", "Notas"]
        data = [
            [
                f.condition_name,
                f.relative,
                f.notes or "—"
            ] for f in report.family_medical_history
        ]
        content = styler.create_data_table(headers, data, col_widths=['30%', '20%', '50%'])
        elems.append(styler.create_info_card(header, content))

    # Construir y enviar el PDF
    doc.build(elems)
    buf.seek(0)

    fn = f"informe_medico_{pi.first_name}_{pi.last_name}_{datetime.now():%Y%m%d}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{fn}"'},
    )