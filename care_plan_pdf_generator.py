#!/usr/bin/env python3
"""
Care Plan PDF Generator for Reconcile C.A.R.E.
Generates professional PDF care plans from database records.

Usage:
    python care_plan_pdf_generator.py <care_plan_id> [output_path]

Dependencies:
    pip install reportlab requests --break-system-packages
"""

import sys
import json
import os
from datetime import datetime
from typing import Optional, Dict, Any, List

import requests
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor, black, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, Image, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

# Supabase configuration
SUPABASE_URL = 'https://zmjxyspizdqhrtdcgkwk.supabase.co'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inptanh5c3BpemRxaHJ0ZGNna3drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjgxODMsImV4cCI6MjA3OTcwNDE4M30.i5rqJXZPSHYFeaA8E26Vh69UPzgCmhrU9zL2kdE8jrM'

# Colors
PRIMARY_BLUE = HexColor('#0f2a6a')
LIGHT_BLUE = HexColor('#f0f9ff')
TEAL = HexColor('#0ea5e9')
SUCCESS_GREEN = HexColor('#22c55e')
WARNING_YELLOW = HexColor('#f59e0b')
DANGER_RED = HexColor('#dc2626')
GRAY_100 = HexColor('#f8fafc')
GRAY_200 = HexColor('#e2e8f0')
GRAY_500 = HexColor('#64748b')
GRAY_700 = HexColor('#374151')

# Score colors
SCORE_COLORS = {
    1: HexColor('#dc2626'),  # Crisis - Red
    2: HexColor('#f97316'),  # At Risk - Orange
    3: HexColor('#eab308'),  # Struggling - Yellow
    4: HexColor('#22c55e'),  # Stable - Green
    5: HexColor('#10b981'),  # Thriving - Teal
}

SCORE_LABELS = {
    1: 'Crisis',
    2: 'At Risk',
    3: 'Struggling',
    4: 'Stable',
    5: 'Thriving',
}

CARE_PLAN_TYPE_LABELS = {
    'initial': 'Initial Care Plan',
    'routine_60_day': '60-Day Routine Review',
    'accelerated_30_day': '30-Day Accelerated Review',
    'event_based': 'Event-Based Review',
    'attorney_request': 'Attorney-Requested Review',
    'discharge': 'Discharge Care Plan',
}

V_NAMES = {
    1: 'Validate',
    2: 'Vitals',
    3: 'Verify',
    4: 'Visualize',
    5: 'Value',
    6: 'Voice',
    7: 'Volunteer',
    8: 'Vigilance',
    9: 'Victory',
    10: 'Verify Discharge',
}


def supabase_fetch(endpoint: str) -> Optional[Any]:
    """Fetch data from Supabase REST API."""
    url = f"{SUPABASE_URL}/rest/v1/{endpoint}"
    headers = {
        'apikey': SUPABASE_KEY,
        'Authorization': f'Bearer {SUPABASE_KEY}',
        'Content-Type': 'application/json',
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    return None


def format_date(date_str: str) -> str:
    """Format ISO date string to readable format."""
    if not date_str:
        return 'N/A'
    try:
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.strftime('%B %d, %Y')
    except:
        return date_str


def format_datetime(date_str: str) -> str:
    """Format ISO datetime string to readable format."""
    if not date_str:
        return 'N/A'
    try:
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.strftime('%B %d, %Y at %I:%M %p')
    except:
        return date_str


class CarePlanPDFGenerator:
    """Generates PDF care plans from database records."""
    
    def __init__(self, care_plan_id: str):
        self.care_plan_id = care_plan_id
        self.care_plan = None
        self.case_info = None
        self.four_ps = None
        self.sdoh = None
        self.overlays = []
        self.guidelines = []
        self.care_vs = []
        self.attestation = None
        self.medications = []
        
        # Set up styles
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Set up custom paragraph styles."""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            textColor=PRIMARY_BLUE,
            spaceAfter=20,
            alignment=TA_CENTER,
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading1'],
            fontSize=14,
            textColor=PRIMARY_BLUE,
            spaceBefore=20,
            spaceAfter=10,
            borderPadding=(0, 0, 5, 0),
        ))
        
        self.styles.add(ParagraphStyle(
            name='SubHeader',
            parent=self.styles['Heading2'],
            fontSize=11,
            textColor=GRAY_700,
            spaceBefore=10,
            spaceAfter=5,
        ))
        
        self.styles.add(ParagraphStyle(
            name='BodyText',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=GRAY_700,
            spaceAfter=6,
            leading=14,
        ))
        
        self.styles.add(ParagraphStyle(
            name='SmallText',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=GRAY_500,
        ))
        
        self.styles.add(ParagraphStyle(
            name='CenterText',
            parent=self.styles['Normal'],
            fontSize=10,
            alignment=TA_CENTER,
        ))
    
    def load_data(self) -> bool:
        """Load all care plan data from database."""
        # Get care plan
        plan_result = supabase_fetch(f'rc_care_plans?id=eq.{self.care_plan_id}')
        if not plan_result:
            return False
        self.care_plan = plan_result[0]
        
        # Get case and client info
        case_result = supabase_fetch(
            f"rc_cases?id=eq.{self.care_plan['case_id']}&select=*,rc_clients(*)"
        )
        if case_result:
            self.case_info = case_result[0]
        
        # Get 4Ps assessment
        four_ps_result = supabase_fetch(
            f"rc_fourps_assessments?care_plan_id=eq.{self.care_plan_id}&order=created_at.desc&limit=1"
        )
        if four_ps_result:
            self.four_ps = four_ps_result[0]
        
        # Get SDOH assessment
        sdoh_result = supabase_fetch(
            f"rc_sdoh_assessments?care_plan_id=eq.{self.care_plan_id}&order=created_at.desc&limit=1"
        )
        if sdoh_result:
            self.sdoh = sdoh_result[0]
        
        # Get overlays
        overlays_result = supabase_fetch(
            f"rc_overlay_selections?care_plan_id=eq.{self.care_plan_id}"
        )
        if overlays_result:
            self.overlays = overlays_result
        
        # Get guidelines
        guidelines_result = supabase_fetch(
            f"rc_guideline_references?care_plan_id=eq.{self.care_plan_id}"
        )
        if guidelines_result:
            self.guidelines = guidelines_result
        
        # Get 10-Vs
        vs_result = supabase_fetch(
            f"rc_care_plan_vs?care_plan_id=eq.{self.care_plan_id}&order=v_number"
        )
        if vs_result:
            self.care_vs = vs_result
        
        # Get attestation
        attestation_result = supabase_fetch(
            f"rc_care_plan_attestations?care_plan_id=eq.{self.care_plan_id}&order=created_at.desc&limit=1"
        )
        if attestation_result:
            self.attestation = attestation_result[0]
        
        # Get medications
        med_rec_result = supabase_fetch(
            f"rc_medication_reconciliations?care_plan_id=eq.{self.care_plan_id}&status=eq.submitted&order=created_at.desc&limit=1"
        )
        if med_rec_result:
            med_rec_id = med_rec_result[0]['id']
            meds_result = supabase_fetch(
                f"rc_medication_items?med_rec_id=eq.{med_rec_id}&still_taking=eq.true"
            )
            if meds_result:
                self.medications = meds_result
        
        return True
    
    def _build_header(self) -> List:
        """Build the PDF header section."""
        elements = []
        
        # Title
        client = self.case_info.get('rc_clients', {}) if self.case_info else {}
        client_name = f"{client.get('first_name', '')} {client.get('last_name', '')}".strip() or 'Unknown Client'
        
        plan_type = self.care_plan.get('care_plan_type', 'initial')
        plan_type_label = CARE_PLAN_TYPE_LABELS.get(plan_type, plan_type)
        
        elements.append(Paragraph(
            f"<b>Reconcile C.A.R.E.</b>",
            self.styles['CenterText']
        ))
        elements.append(Spacer(1, 5))
        elements.append(Paragraph(
            f"Care Plan #{self.care_plan.get('plan_number', 1)}",
            self.styles['CustomTitle']
        ))
        elements.append(Paragraph(
            f"{plan_type_label}",
            self.styles['CenterText']
        ))
        elements.append(Spacer(1, 20))
        
        # Client info table
        case_number = self.case_info.get('case_number', 'N/A') if self.case_info else 'N/A'
        date_of_injury = format_date(self.case_info.get('date_of_injury')) if self.case_info else 'N/A'
        injury_type = self.case_info.get('injury_type', 'N/A') if self.case_info else 'N/A'
        created_date = format_date(self.care_plan.get('created_at', ''))
        
        info_data = [
            ['Client Name:', client_name, 'Case Number:', case_number],
            ['Date of Injury:', date_of_injury, 'Injury Type:', injury_type],
            ['Care Plan Date:', created_date, '', ''],
        ]
        
        info_table = Table(info_data, colWidths=[1.3*inch, 2*inch, 1.3*inch, 2*inch])
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('TEXTCOLOR', (0, 0), (0, -1), GRAY_500),
            ('TEXTCOLOR', (2, 0), (2, -1), GRAY_500),
            ('TEXTCOLOR', (1, 0), (1, -1), GRAY_700),
            ('TEXTCOLOR', (3, 0), (3, -1), GRAY_700),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BACKGROUND', (0, 0), (-1, -1), GRAY_100),
            ('BOX', (0, 0), (-1, -1), 1, GRAY_200),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 20))
        
        return elements
    
    def _build_four_ps_section(self) -> List:
        """Build the 4Ps Wellness Assessment section."""
        elements = []
        
        elements.append(Paragraph("4Ps Wellness Assessment", self.styles['SectionHeader']))
        elements.append(HRFlowable(width="100%", thickness=1, color=GRAY_200))
        elements.append(Spacer(1, 10))
        
        if not self.four_ps:
            elements.append(Paragraph("No 4Ps assessment data available.", self.styles['BodyText']))
            return elements
        
        pillars = [
            ('P1 - Physical Wellness', 'p1_physical', 'p1_notes', '💪'),
            ('P2 - Psychological Wellness', 'p2_psychological', 'p2_notes', '🧠'),
            ('P3 - Psychosocial Wellness', 'p3_psychosocial', 'p3_notes', '👥'),
            ('P4 - Professional Wellness', 'p4_professional', 'p4_notes', '💼'),
        ]
        
        # Summary table
        summary_data = [['Domain', 'Score', 'Status']]
        for label, score_key, _, _ in pillars:
            score = self.four_ps.get(score_key)
            if score:
                status = SCORE_LABELS.get(score, 'Unknown')
                summary_data.append([label, str(score), status])
        
        summary_table = Table(summary_data, colWidths=[3*inch, 1*inch, 1.5*inch])
        summary_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_BLUE),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 15))
        
        # Notes for each pillar
        for label, score_key, notes_key, _ in pillars:
            notes = self.four_ps.get(notes_key)
            if notes:
                elements.append(Paragraph(f"<b>{label} Notes:</b>", self.styles['SubHeader']))
                elements.append(Paragraph(notes, self.styles['BodyText']))
                elements.append(Spacer(1, 5))
        
        return elements
    
    def _build_sdoh_section(self) -> List:
        """Build the SDOH Assessment section."""
        elements = []
        
        elements.append(Paragraph("Social Determinants of Health (SDOH)", self.styles['SectionHeader']))
        elements.append(HRFlowable(width="100%", thickness=1, color=GRAY_200))
        elements.append(Spacer(1, 10))
        
        if not self.sdoh:
            elements.append(Paragraph("No SDOH assessment data available.", self.styles['BodyText']))
            return elements
        
        # Domain scores
        domains = [
            ('Economic Stability', 'economic_score'),
            ('Education Access', 'education_score'),
            ('Healthcare Access', 'healthcare_score'),
            ('Neighborhood & Environment', 'neighborhood_score'),
            ('Social & Community', 'social_score'),
        ]
        
        domain_data = [['Domain', 'Score', 'Status']]
        for label, score_key in domains:
            score = self.sdoh.get(score_key)
            if score:
                status = SCORE_LABELS.get(score, 'Unknown')
                domain_data.append([label, str(score), status])
        
        domain_table = Table(domain_data, colWidths=[3*inch, 1*inch, 1.5*inch])
        domain_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_BLUE),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
        ]))
        elements.append(domain_table)
        elements.append(Spacer(1, 15))
        
        # Flags
        flags = []
        if self.sdoh.get('housing_insecurity'):
            flags.append('Housing Insecurity')
        if self.sdoh.get('food_insecurity'):
            flags.append('Food Insecurity')
        if self.sdoh.get('transportation_barrier'):
            flags.append('Transportation Barrier')
        if self.sdoh.get('financial_hardship'):
            flags.append('Financial Hardship')
        if self.sdoh.get('social_isolation'):
            flags.append('Social Isolation')
        
        if flags:
            elements.append(Paragraph("<b>Identified Barriers:</b>", self.styles['SubHeader']))
            for flag in flags:
                elements.append(Paragraph(f"⚠️ {flag}", self.styles['BodyText']))
        else:
            elements.append(Paragraph("No significant SDOH barriers identified.", self.styles['BodyText']))
        
        return elements
    
    def _build_overlays_section(self) -> List:
        """Build the Condition Overlays section."""
        elements = []
        
        elements.append(Paragraph("Applied Condition Overlays", self.styles['SectionHeader']))
        elements.append(HRFlowable(width="100%", thickness=1, color=GRAY_200))
        elements.append(Spacer(1, 10))
        
        if not self.overlays:
            elements.append(Paragraph("No condition overlays applied.", self.styles['BodyText']))
            return elements
        
        for overlay in self.overlays:
            overlay_type = overlay.get('overlay_type', '').replace('_', ' ').title()
            overlay_subtype = overlay.get('overlay_subtype', '')
            notes = overlay.get('application_notes', '')
            
            title = overlay_type
            if overlay_subtype:
                title += f" ({overlay_subtype})"
            
            elements.append(Paragraph(f"<b>• {title}</b>", self.styles['BodyText']))
            if notes:
                elements.append(Paragraph(f"  {notes}", self.styles['SmallText']))
            elements.append(Spacer(1, 5))
        
        return elements
    
    def _build_guidelines_section(self) -> List:
        """Build the Clinical Guidelines section."""
        elements = []
        
        elements.append(Paragraph("Clinical Guidelines Reference", self.styles['SectionHeader']))
        elements.append(HRFlowable(width="100%", thickness=1, color=GRAY_200))
        elements.append(Spacer(1, 10))
        
        if not self.guidelines:
            elements.append(Paragraph("No clinical guidelines referenced.", self.styles['BodyText']))
            return elements
        
        for guideline in self.guidelines:
            g_type = guideline.get('guideline_type', '').upper()
            g_name = guideline.get('guideline_name', '')
            recommendation = guideline.get('recommendation', '')
            deviation_reason = guideline.get('deviation_reason', '')
            deviation_justification = guideline.get('deviation_justification', '')
            
            elements.append(Paragraph(f"<b>[{g_type}] {g_name}</b>", self.styles['SubHeader']))
            if recommendation:
                elements.append(Paragraph(recommendation, self.styles['BodyText']))
            
            if deviation_reason:
                elements.append(Paragraph(f"<b>⚠️ Deviation:</b> {deviation_reason}", self.styles['BodyText']))
                if deviation_justification:
                    elements.append(Paragraph(f"<b>Justification:</b> {deviation_justification}", self.styles['BodyText']))
            
            elements.append(Spacer(1, 10))
        
        return elements
    
    def _build_ten_vs_section(self) -> List:
        """Build the 10-Vs Care Management section."""
        elements = []
        
        elements.append(Paragraph("10-Vs of Care Management", self.styles['SectionHeader']))
        elements.append(HRFlowable(width="100%", thickness=1, color=GRAY_200))
        elements.append(Spacer(1, 10))
        
        if not self.care_vs:
            elements.append(Paragraph("No 10-Vs data available.", self.styles['BodyText']))
            return elements
        
        for v in self.care_vs:
            v_num = v.get('v_number', 0)
            v_name = V_NAMES.get(v_num, f'V{v_num}')
            status = v.get('status', 'pending')
            findings = v.get('findings', '')
            recommendations = v.get('recommendations', '')
            
            status_text = '✓' if status == 'completed' else '○'
            elements.append(Paragraph(
                f"<b>{status_text} V{v_num} – {v_name}</b> ({status})",
                self.styles['SubHeader']
            ))
            
            if findings:
                elements.append(Paragraph(f"<b>Findings:</b> {findings}", self.styles['BodyText']))
            if recommendations:
                elements.append(Paragraph(f"<b>Recommendations:</b> {recommendations}", self.styles['BodyText']))
            
            elements.append(Spacer(1, 8))
        
        return elements
    
    def _build_medications_section(self) -> List:
        """Build the Current Medications section."""
        elements = []
        
        elements.append(Paragraph("Current Medications", self.styles['SectionHeader']))
        elements.append(HRFlowable(width="100%", thickness=1, color=GRAY_200))
        elements.append(Spacer(1, 10))
        
        if not self.medications:
            elements.append(Paragraph("No medications on file.", self.styles['BodyText']))
            return elements
        
        med_data = [['Medication', 'Dosage', 'Frequency', 'Prescriber']]
        for med in self.medications:
            med_data.append([
                med.get('medication_name', ''),
                med.get('dosage', '') or '-',
                med.get('frequency', '') or '-',
                med.get('prescriber', '') or '-',
            ])
        
        med_table = Table(med_data, colWidths=[2*inch, 1.2*inch, 1.5*inch, 1.8*inch])
        med_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, 0), (-1, 0), PRIMARY_BLUE),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('GRID', (0, 0), (-1, -1), 0.5, GRAY_200),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [white, GRAY_100]),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(med_table)
        
        return elements
    
    def _build_attestation_section(self) -> List:
        """Build the Attestation section."""
        elements = []
        
        elements.append(Paragraph("Care Plan Attestation", self.styles['SectionHeader']))
        elements.append(HRFlowable(width="100%", thickness=1, color=GRAY_200))
        elements.append(Spacer(1, 10))
        
        if not self.attestation:
            elements.append(Paragraph("This care plan has not been finalized.", self.styles['BodyText']))
            return elements
        
        attested_at = format_datetime(self.attestation.get('attested_at', ''))
        
        elements.append(Paragraph(
            f"<b>✓ Care Plan Finalized</b>",
            self.styles['BodyText']
        ))
        elements.append(Paragraph(
            f"Attested on {attested_at}",
            self.styles['BodyText']
        ))
        elements.append(Spacer(1, 10))
        
        skipped = self.attestation.get('skipped_sections', [])
        if skipped:
            elements.append(Paragraph("<b>Sections marked N/A:</b>", self.styles['BodyText']))
            elements.append(Paragraph(", ".join(skipped), self.styles['BodyText']))
            justification = self.attestation.get('skipped_justification', '')
            if justification:
                elements.append(Paragraph(f"<b>Justification:</b> {justification}", self.styles['BodyText']))
        
        elements.append(Spacer(1, 15))
        elements.append(Paragraph(
            "By finalizing this care plan, the RN attested that all information has been reviewed "
            "for accuracy, clinical guidelines have been appropriately referenced, client-specific "
            "overlays have been considered, and this care plan reflects appropriate clinical judgment.",
            self.styles['SmallText']
        ))
        
        return elements
    
    def _build_footer(self, canvas, doc):
        """Build the page footer."""
        canvas.saveState()
        
        # Footer line
        canvas.setStrokeColor(GRAY_200)
        canvas.line(0.75*inch, 0.6*inch, 7.75*inch, 0.6*inch)
        
        # Footer text
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(GRAY_500)
        canvas.drawString(0.75*inch, 0.4*inch, "Reconcile C.A.R.E. – Confidential Health Information")
        canvas.drawRightString(7.75*inch, 0.4*inch, f"Page {doc.page}")
        
        # Generated timestamp
        now = datetime.now().strftime('%B %d, %Y at %I:%M %p')
        canvas.drawCentredString(4.25*inch, 0.25*inch, f"Generated: {now}")
        
        canvas.restoreState()
    
    def generate(self, output_path: str) -> bool:
        """Generate the PDF document."""
        if not self.load_data():
            print(f"Error: Could not load care plan {self.care_plan_id}")
            return False
        
        doc = SimpleDocTemplate(
            output_path,
            pagesize=letter,
            rightMargin=0.75*inch,
            leftMargin=0.75*inch,
            topMargin=0.75*inch,
            bottomMargin=0.75*inch,
        )
        
        elements = []
        
        # Build sections
        elements.extend(self._build_header())
        elements.extend(self._build_four_ps_section())
        elements.append(Spacer(1, 15))
        elements.extend(self._build_sdoh_section())
        elements.append(PageBreak())
        elements.extend(self._build_overlays_section())
        elements.append(Spacer(1, 15))
        elements.extend(self._build_guidelines_section())
        elements.append(Spacer(1, 15))
        elements.extend(self._build_ten_vs_section())
        elements.append(PageBreak())
        elements.extend(self._build_medications_section())
        elements.append(Spacer(1, 15))
        elements.extend(self._build_attestation_section())
        
        # Build document
        doc.build(
            elements,
            onFirstPage=self._build_footer,
            onLaterPages=self._build_footer,
        )
        
        print(f"✓ PDF generated: {output_path}")
        return True


def main():
    if len(sys.argv) < 2:
        print("Usage: python care_plan_pdf_generator.py <care_plan_id> [output_path]")
        sys.exit(1)
    
    care_plan_id = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else f"care_plan_{care_plan_id}.pdf"
    
    generator = CarePlanPDFGenerator(care_plan_id)
    success = generator.generate(output_path)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()