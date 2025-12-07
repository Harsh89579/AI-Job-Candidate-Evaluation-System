from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os

# Import your modules
from models.predictor import predict_resume
from readers.pdf_reader import read_pdf
from readers.docx_reader import read_docx
from processors.text_cleaner import clean_text
from processors.resume_parser import parse_resume

app = FastAPI(title="EvalX Resume Screening API")

# CORS Middleware (for frontend connection)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "EvalX Resume Screening API is running"}


@app.post("/evaluate-resume")
async def evaluate_resume(file: UploadFile = File(...)):
    """
    Upload a resume file → extract text → clean → parse → ML prediction
    """

    filename = file.filename.lower()

    # 1️⃣ Extract text based on file type
    if filename.endswith(".pdf"):
        text = read_pdf(file.file)
    elif filename.endswith(".docx"):
        text = read_docx(file.file)
    else:
        return {"error": "Only PDF or DOCX files are allowed."}

    # 2️⃣ Clean extracted text
    cleaned_text = clean_text(text)

    # 3️⃣ Parse resume (skills, education, etc.)
    parsed_data = parse_resume(cleaned_text)

    # 4️⃣ ML prediction (label + confidence score)
    ml_result = predict_resume(cleaned_text)

    return {
        "filename": filename,
        "parsed_resume": parsed_data,
        "prediction": ml_result,
    }




