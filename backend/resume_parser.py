import re
from readers.pdf_reader import read_pdf
from readers.docx_reader import read_docx
from utils.text_cleaning import clean_text




EMAIL_RE = re.compile(r"[a-zA-Z0-9.\-+_]+@[a-zA-Z0-9.\-+_]+\.[a-zA-Z]+")
PHONE_RE = re.compile(r"\+?\d[\d -]{8,12}\d")

SKILLS_DB = [
    "python", "java", "c++", "html", "css", "javascript",
    "sql", "machine learning", "deep learning",
    "react", "node", "django", "flask", "fastapi"
]

def extract_email(text):
    emails = EMAIL_RE.findall(text)
    return emails[0] if emails else None

def extract_phone(text):
    phones = PHONE_RE.findall(text)
    return phones[0] if phones else None

def extract_skills(text):
    found = []
    for skill in SKILLS_DB:
        if skill.lower() in text.lower():
            found.append(skill)
    return list(set(found))

def parse_resume(path):
    if path.endswith(".pdf"):
        raw = read_pdf(path)
    elif path.endswith(".docx"):
        raw = read_docx(path)
    else:
        return {"error": "Unsupported file type"}

    cleaned = clean_text(raw)

    return {
        "email": extract_email(raw),
        "phone": extract_phone(raw),
        "skills": extract_skills(cleaned),
        "raw_text": raw
    }
