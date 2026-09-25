import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT

class PDFService:
    @staticmethod
    def generate_claim_form(data: dict) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        
        styles = getSampleStyleSheet()
        # Custom Styles
        title_style = ParagraphStyle('Title', parent=styles['Heading1'], alignment=TA_CENTER, fontSize=18, spaceAfter=20, textColor=colors.darkblue)
        subtitle_style = ParagraphStyle('SubTitle', parent=styles['Heading2'], fontSize=14, spaceAfter=10, textColor=colors.black)
        normal_style = styles['Normal']
        normal_style.fontSize = 10
        normal_style.leading = 14
        
        elements = []

        # --- HEADER ---
        elements.append(Paragraph("PRADHAN MANTRI FASAL BIMA YOJANA (PMFBY)", title_style))
        elements.append(Paragraph(f"CROP LOSS CLAIM FORM - {datetime.now().year}", subtitle_style))
        elements.append(Spacer(1, 10))
        elements.append(Paragraph("<i>(Under Ministry of Agriculture & Farmers Welfare, Govt. of India)</i>", ParagraphStyle('CenteredItalic', parent=normal_style, alignment=TA_CENTER)))
        elements.append(Spacer(1, 20))

        # --- SECTION 1: FARMER DETAILS ---
        elements.append(Paragraph("1. FARMER DETAILS", subtitle_style))
        
        details_data = [
            ["Farmer Name:", data.get("farmer_name", "N/A")],
            ["Father/Husband Name:", data.get("guardian_name", "N/A")],
            ["Mobile No:", data.get("mobile", "N/A")],
            ["Aadhaar No:", data.get("aadhaar", "N/A")],
            ["Address:", data.get("address", "N/A")],
        ]
        
        t1 = Table(details_data, colWidths=[150, 300])
        t1.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), colors.whitesmoke),
            ('TEXTCOLOR', (0,0), (0,-1), colors.black),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
        ]))
        elements.append(t1)
        elements.append(Spacer(1, 15))

        # --- SECTION 2: BANK DETAILS ---
        elements.append(Paragraph("2. BANK ACCOUNT DETAILS (For DBT)", subtitle_style))
        bank_data = [
            ["Account Holder Name:", data.get("account_holder", data.get("farmer_name", ""))],
            ["Bank Name:", data.get("bank_name", "N/A")],
            ["Branch Name:", data.get("branch_name", "N/A")],
            ["Account Number:", data.get("account_number", "N/A")],
            ["IFSC Code:", data.get("ifsc", "N/A")],
        ]
        t2 = Table(bank_data, colWidths=[150, 300])
        t2.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), colors.whitesmoke),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t2)
        elements.append(Spacer(1, 15))

        # --- SECTION 3: LAND & CROP DETAILS ---
        elements.append(Paragraph("3. CROP LOSS DETAILS", subtitle_style))
        crop_data = [
            ["Survey/Khasra No:", data.get("survey_no", "N/A")],
            ["Village/Tehsil:", data.get("village", "N/A")],
            ["Crop Name:", data.get("crop_name", "N/A")],
            ["Sowing Date:", data.get("sowing_date", "N/A")],
            ["Area Insured (Ha):", data.get("area_insured", "N/A")],
            ["Date of Loss:", data.get("loss_date", "N/A")],
            ["Cause of Loss:", data.get("loss_cause", "N/A")],
            ["Est. Loss %:", f"{data.get('loss_percentage', '0')}%"],
        ]
        t3 = Table(crop_data, colWidths=[150, 300])
        t3.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), colors.whitesmoke),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t3)
        elements.append(Spacer(1, 20))

        # --- DECLARATION ---
        elements.append(Paragraph("DECLARATION", subtitle_style))
        decl_text = "I hereby declare that the particulars given above are true and correct to the best of my knowledge and belief. I have not claimed any compensation for the same loss from any other source."
        elements.append(Paragraph(decl_text, normal_style))
        elements.append(Spacer(1, 40))

        # --- SIGNATURES ---
        sig_data = [
            ["_______________________", "_______________________"],
            ["Signature of Farmer", "Signature of Village Official/Patwari"],
            ["Date: ____________", "Seal: _________________"]
        ]
        t4 = Table(sig_data, colWidths=[250, 250])
        t4.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,1), (-1,1), 'Helvetica-Bold'),
            ('TOPPADDING', (0,0), (-1,-1), 10),
        ]))
        elements.append(t4)
        
        # --- FOOTER LOGIC (Simplified) ---
        # Add a generated footer? 
        elements.append(Spacer(1, 30))
        elements.append(Paragraph("Generated by SankatSaathi AI • Supporting Indian Farmers", ParagraphStyle('Footer', parent=normal_style, alignment=TA_CENTER, fontSize=8, textColor=colors.grey)))


        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def generate_irrigation_log(data: dict) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('Title', parent=styles['Heading1'], alignment=TA_CENTER, fontSize=16, spaceAfter=20, textColor=colors.darkblue)
        normal_style = styles['Normal']
        
        elements = []
        
        # Header
        elements.append(Paragraph("AUTOMATED IRRIGATION SYSTEM LOG", title_style))
        elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ParagraphStyle('Date', parent=normal_style, alignment=TA_CENTER)))
        elements.append(Spacer(1, 20))
        
        # Activity Details
        activity_data = [
            ["Action Performed:", data.get("action", "Unknown")],
            ["Batch ID:", data.get("batch_id", "N/A")],
            ["Time Triggered:", data.get("timestamp", "N/A")],
        ]
        
        # Add Metrics
        metrics = data.get("metrics", {})
        for k, v in metrics.items():
            activity_data.append([f"Sensor {k}:", str(v)])
            
        t = Table(activity_data, colWidths=[200, 250])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (0,-1), colors.whitesmoke),
            ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 30))
        
        # Blockchain Proof
        elements.append(Paragraph("<b>BLOCKCHAIN VERIFICATION PROOF</b>", styles['Heading3']))
        
        hash_val = data.get("hash", "PENDING_CONSENSUS")
        elements.append(Paragraph(f"Transaction Hash:<br/><font color='blue' size=8>{hash_val}</font>", normal_style))
        
        elements.append(Spacer(1, 40))
        elements.append(Paragraph("<i>This record is immutably stored on the crop ledger.</i>", ParagraphStyle('Footer', parent=normal_style, alignment=TA_CENTER, fontSize=8, textColor=colors.grey)))
        
        doc.build(elements)
        buffer.seek(0)
        return buffer.getvalue()

