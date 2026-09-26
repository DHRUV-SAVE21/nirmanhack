import os
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch
from datetime import datetime
import qrcode
from io import BytesIO
import tempfile

def generate_claim_pdf_buffer(claim_data: dict, validation_summary: str, official_name: str) -> BytesIO:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # Header
    c.setFont("Helvetica-Bold", 18)
    c.drawString(1 * inch, height - 1 * inch, "Official Crop Loss Claim Report")
    
    c.setFont("Helvetica", 10)
    c.drawString(1 * inch, height - 1.3 * inch, f"Generated on: {datetime.now().strftime('%d-%m-%Y %H:%M')}")
    c.drawString(4.5 * inch, height - 1.3 * inch, f"Claim ID: {claim_data.get('reference_no', 'N/A')}")

    # Separator Line
    c.setStrokeColor(colors.gray)
    c.line(1 * inch, height - 1.5 * inch, width - 1 * inch, height - 1.5 * inch)

    # 1. Farmer Details
    y = height - 2 * inch
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1 * inch, y, "1. Farmer Details")
    y -= 0.3 * inch
    
    c.setFont("Helvetica", 12)
    farmer_name = claim_data.get('farmer_name') or claim_data.get('farmer_profiles', {}).get('name') or "N/A"
    c.drawString(1.2 * inch, y, f"Name: {farmer_name}")
    y -= 0.25 * inch
    c.drawString(1.2 * inch, y, f"Phone: {claim_data.get('farmer_phone', 'N/A')}")
    y -= 0.25 * inch
    c.drawString(1.2 * inch, y, f"Aadhaar (Last 4): {claim_data.get('aadhaar_number', 'XXXX')[-4:]}")

    # 2. Land & Crop Details
    y -= 0.5 * inch
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1 * inch, y, "2. Land & Crop Information")
    y -= 0.3 * inch
    
    c.setFont("Helvetica", 12)
    c.drawString(1.2 * inch, y, f"Crop: {claim_data.get('crop_name', 'N/A')}")
    y -= 0.25 * inch
    c.drawString(1.2 * inch, y, f"Land Size: {claim_data.get('land_size', 0)} {claim_data.get('land_unit', 'Acres')}")
    y -= 0.25 * inch
    c.drawString(1.2 * inch, y, f"Calculated NDVI: {claim_data.get('ndvi_value', 'N/A')}")

    # 3. Assessment
    y -= 0.5 * inch
    c.setFont("Helvetica-Bold", 14)
    c.drawString(1 * inch, y, "3. Assessment Summary")
    y -= 0.3 * inch
    
    c.setFont("Helvetica", 12)
    loss = claim_data.get('crop_loss_percentage', 0)
    c.drawString(1.2 * inch, y, f"Validated Loss Percentage: {loss}%")
    
    # Inspector Report if available
    insp_report = claim_data.get('inspection_report', {})
    if insp_report:
        y -= 0.25 * inch
        c.drawString(1.2 * inch, y, f"Field Inspector Remarks: {insp_report.get('remarks', 'N/A')}")
        y -= 0.25 * inch
        c.drawString(1.2 * inch, y, f"Inspector Estimated Loss: {insp_report.get('loss_estimate', 'N/A')}%")

    # 4. AI Validation Summary (Box)
    y -= 0.6 * inch
    c.setFillColor(colors.lightgrey)
    c.rect(1 * inch, y - 1.5*inch, width - 2 * inch, 1.8 * inch, fill=True, stroke=False)
    
    c.setFillColor(colors.black)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(1.2 * inch, y, "AI Validation Summary:")
    
    c.setFont("Helvetica", 10)
    text = c.beginText(1.2 * inch, y - 0.3 * inch)
    # Split summary into lines
    lines = validation_summary.split('\n')
    for line in lines[:8]: # Limit lines
        text.textLine(line)
    c.drawText(text)

    # 5. Authorization
    y -= 2.5 * inch
    c.setStrokeColor(colors.black)
    c.line(1 * inch, y + 0.5 * inch, 3.5 * inch, y + 0.5 * inch)
    c.setFont("Helvetica-Oblique", 10)
    c.drawString(1 * inch, y + 0.3 * inch, f"Authorized Signature: {official_name}")
    
    # QR Code Generation
    qr = qrcode.QRCode(box_size=5, border=1)
    # Verification URL (e.g., public verification page)
    # verify_url = f"https://annadata-saathi.com/verify-claim/{claim_data['id']}"
    verify_url = f"CLAIM-ID:{claim_data['id']}-VERIFIED" 
    qr.add_data(verify_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Save QR to temp file to draw on PDF
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
            tmp_path = tmp.name
            img.save(tmp)
        
        # Draw image from closed file
        c.drawImage(tmp_path, width - 2.5 * inch, y, width=1.5*inch, height=1.5*inch)
    except Exception as e:
        print(f"Error drawing QR code: {e}")
    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception as e:
                print(f"Warning: Could not remove temp file {tmp_path}: {e}")

    c.showPage()
    c.save()
    
    buffer.seek(0)
    return buffer
