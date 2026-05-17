from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, black, white
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib import colors
from reportlab.lib.units import inch
from io import BytesIO
from datetime import datetime

from app.db.session import get_db
from app.models.models import Decision, User
from app.core.dependencies import get_current_user

router = APIRouter()


@router.get("/{decision_id}/pdf")
async def download_transparency_report(
    decision_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Decision)
        .options(selectinload(Decision.explanation), selectinload(Decision.citizen), selectinload(Decision.officer))
        .where(Decision.id == decision_id)
    )
    decision = result.scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    if current_user.role.value == "citizen" and decision.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    pdf_bytes = generate_pdf_report(decision)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="transparency_report_{decision_id}.pdf"'},
    )


def generate_pdf_report(decision: Decision) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=0.75*inch, leftMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)

    styles = getSampleStyleSheet()
    primary_color = HexColor("#0891B2")
    dark_color = HexColor("#0F2044")

    title_style = ParagraphStyle("CustomTitle", parent=styles["Title"], fontSize=20, textColor=dark_color, spaceAfter=6)
    heading_style = ParagraphStyle("CustomHeading", parent=styles["Heading2"], fontSize=13, textColor=primary_color, spaceAfter=4)
    body_style = ParagraphStyle("CustomBody", parent=styles["Normal"], fontSize=10, spaceAfter=4, leading=14)
    label_style = ParagraphStyle("Label", parent=styles["Normal"], fontSize=9, textColor=HexColor("#64748B"))

    story = []

    # Header
    story.append(Paragraph("🏛️ XAI-Gov", title_style))
    story.append(Paragraph("AI Decision Transparency Report", heading_style))
    story.append(HRFlowable(width="100%", thickness=2, color=primary_color))
    story.append(Spacer(1, 0.2*inch))

    # Report metadata
    meta_data = [
        ["Report Generated:", datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")],
        ["Decision ID:", f"#{decision.id}"],
        ["Citizen:", decision.citizen.full_name if decision.citizen else "N/A"],
        ["Application Type:", decision.application_type.value.upper()],
        ["Submission Date:", decision.created_at.strftime("%Y-%m-%d")],
    ]
    meta_table = Table(meta_data, colWidths=[2*inch, 4*inch])
    meta_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), HexColor("#64748B")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [HexColor("#F8FAFC"), white]),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 0.2*inch))

    # AI Decision
    story.append(Paragraph("AI Decision Summary", heading_style))
    ai_approved = decision.ai_decision
    final_decision = decision.officer_decision if decision.officer_decision is not None else ai_approved
    decision_color = HexColor("#10B981") if final_decision else HexColor("#EF4444")

    decision_data = [
        ["AI Decision:", "APPROVED ✓" if ai_approved else "REJECTED ✗"],
        ["Final Decision:", "APPROVED ✓" if final_decision else "REJECTED ✗"],
        ["AI Confidence:", f"{round((decision.confidence_score or 0) * 100, 1)}%"],
        ["Fairness Score:", f"{round((decision.fairness_score or 0) * 100, 1)}%"],
        ["Bias Detected:", "Yes ⚠️" if decision.bias_detected else "No ✓"],
        ["Officer Override:", "Yes" if decision.is_overridden else "No"],
    ]
    dec_table = Table(decision_data, colWidths=[2*inch, 4*inch])
    dec_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), HexColor("#64748B")),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [HexColor("#F0FDF4") if final_decision else HexColor("#FEF2F2"), white]),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(dec_table)
    story.append(Spacer(1, 0.2*inch))

    # Applicant Profile
    story.append(Paragraph("Applicant Profile", heading_style))
    profile_data = [
        ["Annual Income:", f"₹{decision.income:,.0f}" if decision.income else "N/A"],
        ["Family Size:", str(decision.family_size or "N/A")],
        ["Education Level:", ["None", "Primary", "Secondary", "High School", "Bachelor's", "Post Graduate"][decision.education_level or 0]],
        ["Health Status:", ["", "Critical", "Poor", "Fair", "Good", "Excellent"][decision.health_status or 0]],
        ["Employment:", ["Unemployed", "Part-time", "Full-time", "Self-employed"][decision.employment_status or 0]],
        ["Age:", str(decision.age or "N/A")],
        ["Disability:", "Yes" if decision.disability_status else "No"],
    ]
    prof_table = Table(profile_data, colWidths=[2*inch, 4*inch])
    prof_table.setStyle(TableStyle([
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (0, 0), (0, -1), HexColor("#64748B")),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [HexColor("#F8FAFC"), white]),
        ("GRID", (0, 0), (-1, -1), 0.5, HexColor("#E2E8F0")),
        ("PADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(prof_table)
    story.append(Spacer(1, 0.2*inch))

    # AI Explanation
    if decision.explanation:
        story.append(Paragraph("AI Explanation", heading_style))
        story.append(Paragraph(decision.explanation.plain_english_explanation or "No explanation available.", body_style))
        story.append(Spacer(1, 0.1*inch))

        if decision.explanation.top_positive_factors:
            story.append(Paragraph("Positive Contributing Factors:", ParagraphStyle("Bold", parent=body_style, fontName="Helvetica-Bold")))
            for f in decision.explanation.top_positive_factors:
                story.append(Paragraph(f"• {f.get('feature', 'N/A')}: Impact +{round(f.get('impact', 0), 3)}", body_style))

        if decision.explanation.top_negative_factors:
            story.append(Paragraph("Negative Contributing Factors:", ParagraphStyle("Bold", parent=body_style, fontName="Helvetica-Bold")))
            for f in decision.explanation.top_negative_factors:
                story.append(Paragraph(f"• {f.get('feature', 'N/A')}: Impact {round(f.get('impact', 0), 3)}", body_style))

    story.append(Spacer(1, 0.2*inch))
    story.append(HRFlowable(width="100%", thickness=1, color=HexColor("#E2E8F0")))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph("This report is generated automatically by XAI-Gov's Explainable AI system. "
                           "All decisions are subject to human review and can be appealed.", label_style))
    story.append(Paragraph("© XAI-Gov — Transparent AI for Accountable Governance", label_style))

    doc.build(story)
    return buffer.getvalue()
