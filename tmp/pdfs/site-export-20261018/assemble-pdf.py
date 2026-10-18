import json
from datetime import datetime
from pathlib import Path

from pypdf import PdfReader, PdfWriter
from reportlab.lib import colors
from reportlab.lib.pagesizes import A3, landscape
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parent
SECTIONS_DIR = ROOT / "sections"
OUTPUT = Path("output/pdf/Internship-Committee-Portal-All-Pages.pdf").resolve()
MANIFEST = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
PAGE_SIZE = landscape(A3)
WIDTH, HEIGHT = PAGE_SIZE
CREAM = colors.HexColor("#F5F1E8")
NAVY = colors.HexColor("#142B48")
MUTED = colors.HexColor("#657488")
ACCENT = colors.HexColor("#183B66")


def section_page_ranges():
    ranges = []
    cursor = 3  # Cover and contents occupy pages one and two.
    for section in MANIFEST["sections"]:
        path = SECTIONS_DIR / section["file"]
        reader = PdfReader(str(path))
        count = len(reader.pages)
        ranges.append({**section, "start": cursor, "end": cursor + count - 1, "count": count})
        cursor += count
    return ranges, cursor - 1


def draw_cover(pdf, total_pages, ranges):
    pdf.setFillColor(CREAM)
    pdf.rect(0, 0, WIDTH, HEIGHT, stroke=0, fill=1)
    pdf.setFillColor(colors.HexColor("#ECE6DA"))
    pdf.circle(WIDTH - 110, HEIGHT - 80, 255, stroke=0, fill=1)
    pdf.setFillColor(colors.HexColor("#E7DFD1"))
    pdf.circle(WIDTH - 110, HEIGHT - 80, 180, stroke=0, fill=1)
    pdf.setStrokeColor(colors.HexColor("#CFC6B6"))
    pdf.setLineWidth(0.7)
    pdf.line(64, HEIGHT - 92, WIDTH - 64, HEIGHT - 92)

    pdf.setFillColor(ACCENT)
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(66, HEIGHT - 68, "INTERNSHIP COMMITTEE  /  IIM ROHTAK")

    pdf.setFillColor(NAVY)
    pdf.setFont("Times-Roman", 66)
    pdf.drawString(64, HEIGHT - 224, "Student portal")
    pdf.setFont("Helvetica-Bold", 28)
    pdf.drawString(67, HEIGHT - 276, "COMPLETE WEBSITE EXPORT")

    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 15)
    pdf.drawString(68, HEIGHT - 322, "Primary pages, live listings, and expanded course collections")

    pdf.setStrokeColor(ACCENT)
    pdf.setLineWidth(3)
    pdf.line(68, HEIGHT - 370, 252, HEIGHT - 370)

    course_count = sum(domain["count"] for domain in MANIFEST["domains"] if domain["name"] != "All Courses")
    domain_count = max(0, len(MANIFEST["domains"]) - 1)
    summary = [
        ("PAGES", str(total_pages)),
        ("DOMAINS", str(domain_count)),
        ("COURSES", f"{course_count:,}"),
        ("SECTIONS", str(len(ranges))),
    ]
    box_y = 146
    box_width = (WIDTH - 136 - 3 * 20) / 4
    for index, (label, value) in enumerate(summary):
        x = 68 + index * (box_width + 20)
        pdf.setFillColor(colors.HexColor("#FFFCF6"))
        pdf.roundRect(x, box_y, box_width, 92, 4, stroke=0, fill=1)
        pdf.setFillColor(MUTED)
        pdf.setFont("Helvetica-Bold", 9)
        pdf.drawString(x + 17, box_y + 63, label)
        pdf.setFillColor(NAVY)
        pdf.setFont("Times-Roman", 27)
        pdf.drawString(x + 17, box_y + 22, value)

    pdf.setFillColor(MUTED)
    pdf.setFont("Courier", 9)
    pdf.drawString(68, 74, "LIVE SHEET CONTENT  /  18 OCTOBER 2026")
    pdf.drawRightString(WIDTH - 68, 74, "LIVE PROJECTS: MEMBER ACCESS REQUIRED")
    pdf.showPage()


def draw_contents(pdf, ranges):
    pdf.setFillColor(CREAM)
    pdf.rect(0, 0, WIDTH, HEIGHT, stroke=0, fill=1)
    pdf.setFillColor(NAVY)
    pdf.setFont("Times-Roman", 39)
    pdf.drawString(64, HEIGHT - 78, "Contents")
    pdf.setFillColor(MUTED)
    pdf.setFont("Helvetica", 12)
    pdf.drawRightString(WIDTH - 64, HEIGHT - 70, f"{len(ranges)} WEBSITE SECTIONS")

    margin = 64
    gap = 54
    column_width = (WIDTH - 2 * margin - gap) / 2
    top = HEIGHT - 140
    row_gap = 70
    half = (len(ranges) + 1) // 2

    pdf.setStrokeColor(colors.HexColor("#D2CABC"))
    pdf.setLineWidth(0.7)
    pdf.line(WIDTH / 2, 84, WIDTH / 2, HEIGHT - 132)

    for index, item in enumerate(ranges):
        column = 0 if index < half else 1
        row = index if column == 0 else index - half
        x = margin + column * (column_width + gap)
        y = top - row * row_gap
        pdf.setFillColor(ACCENT)
        pdf.setFont("Courier-Bold", 9)
        pdf.drawString(x, y, f"{index + 1:02d}")

        pdf.setFillColor(NAVY)
        pdf.setFont("Times-Roman", 16)
        display_title = item["title"].replace("—", "-").replace("–", "-").replace("·", "/")
        pdf.drawString(x + 35, y - 1, display_title[:48])

        page_range = str(item["start"]) if item["start"] == item["end"] else f"{item['start']}-{item['end']}"
        pdf.setFillColor(MUTED)
        pdf.setFont("Courier", 9)
        pdf.drawRightString(x + column_width, y, f"P. {page_range}")

        pdf.setStrokeColor(colors.HexColor("#DED8CC"))
        pdf.line(x + 35, y - 17, x + column_width, y - 17)

        if item["count"] > 1:
            pdf.setFont("Helvetica", 9)
            pdf.setFillColor(MUTED)
            pdf.drawString(x + 35, y - 34, f"{item['count']} pages")

    pdf.setFillColor(MUTED)
    pdf.setFont("Courier", 9)
    pdf.drawString(64, 58, "COURSE ALIASES REDIRECT TO THEIR CANONICAL PAGES.")
    pdf.drawRightString(WIDTH - 64, 58, f"TOTAL: {sum(item['count'] for item in ranges) + 2} PAGES")
    pdf.showPage()


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    ranges, total_pages = section_page_ranges()
    front_path = ROOT / "front-matter.pdf"
    front = canvas.Canvas(str(front_path), pagesize=PAGE_SIZE, pageCompression=1)
    front.setTitle("Internship Committee Student Portal — Complete Website Export")
    front.setAuthor("Internship Committee, IIM Rohtak")
    front.setSubject("Rendered website pages and live course, resource, and competition listings")
    draw_cover(front, total_pages, ranges)
    draw_contents(front, ranges)
    front.save()

    writer = PdfWriter()
    writer.append(PdfReader(str(front_path)))
    for item in ranges:
        writer.append(PdfReader(str(SECTIONS_DIR / item["file"])))

    for item in ranges:
        writer.add_outline_item(item["title"], item["start"] - 1)

    writer.add_metadata({
        "/Title": "Internship Committee Student Portal - Complete Website Export",
        "/Author": "Internship Committee, IIM Rohtak",
        "/Subject": "Rendered website pages and live course, resource, and competition listings",
        "/Creator": "Codex website PDF export",
        "/CreationDate": datetime.now().strftime("D:%Y%m%d%H%M%S"),
    })
    with OUTPUT.open("wb") as destination:
        writer.write(destination)

    print(f"Output: {OUTPUT}")
    print(f"Pages: {total_pages}")
    print(f"Sections: {len(ranges)}")
    for item in ranges:
        print(f"{item['start']:>4}–{item['end']:<4} {item['title']}")


if __name__ == "__main__":
    main()
