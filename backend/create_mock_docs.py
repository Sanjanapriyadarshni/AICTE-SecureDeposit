import os

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

files = [
    "fdr_sample_sbi.pdf",
    "fdr_sample_pnb.pdf",
    "fdr_sample_canara.pdf",
    "fdr_sample_bob.pdf",
    "fdr_sample_hdfc.pdf",
    "fdr_sample_union.pdf",
    "fdr_sample_discrepancy.pdf",
    "fdr_cbi_scan.pdf",
    "fdr_icici_old.pdf",
    "fdr_sample_iob.pdf",
    "fdr_sbi_abids.pdf",
    "fdr_canara_released.pdf",
    "renewal_fdr_receipt.pdf",
    "noc_institution_release.pdf",
    "aicte_noc_kcg_10yr.pdf",
    "aicte_noc_excess_refund.pdf",
    "canara_final_noc.pdf"
]

# Simple valid minimal PDF content
def make_simple_pdf(title, details):
    content = f"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj
5 0 obj << /Length 200 >> stream
BT
/F1 16 Tf
50 720 Td
({title}) Tj
/F1 11 Tf
0 -30 Td
({details}) Tj
0 -25 Td
(All India Council for Technical Education - Mandatory Collateral) Tj
0 -20 Td
(Joint Lien: Member Secretary, AICTE New Delhi) Tj
0 -20 Td
(Official Core Banking System Verified Deposit Voucher) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000069 00000 n 
0000000128 00000 n 
0000000257 00000 n 
0000000336 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
590
%%EOF"""
    return content.encode('latin1')

for filename in files:
    filepath = os.path.join(UPLOAD_DIR, filename)
    name_clean = filename.replace('.pdf', '').replace('_', ' ').upper()
    pdf_bytes = make_simple_pdf("AICTE SECURITY DEPOSIT RECEIPT", name_clean)
    with open(filepath, "wb") as f:
        f.write(pdf_bytes)

print(f"Generated {len(files)} sample mock FDR documents in {UPLOAD_DIR}")
