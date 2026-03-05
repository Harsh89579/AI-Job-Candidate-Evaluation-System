from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request, Body
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import StreamingResponse
import sys
import os
import io
import logging
from dotenv import load_dotenv
import asyncio
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

# Add parent directory to path to allow absolute imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.file_extraction import extract_text
from utils.text_processing import preprocess_text
from utils.skills_extractor import extract_skills
from utils.ml_utils import predict_suitability, load_model
from utils.role_skills import get_missing_skills
from utils.interview_utils import generate_improvement_roadmap, generate_interview_questions, evaluate_interview
from pydantic import BaseModel
import shutil

from fastapi.middleware.gzip import GZipMiddleware

app = FastAPI(title="Resume Analyzer API")

# Add GZip compression for faster responses
app.add_middleware(GZipMiddleware, minimum_size=1000)

UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))

# ---- Logging Setup ----
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("HR_API")

from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    logger.info("Starting up FastAPI Server. Attempting to load ML Model...")
    load_dotenv()
    if not os.getenv("GEMINI_API_KEY"):
        logger.warning("CRITICAL: GEMINI_API_KEY is not set in the environment. AI Interview features will be unavailable.")
    try:
        load_model()
        load_model()
    except Exception as e:
        logger.error(f"Failed to load ML model during startup: {e}. AI Score features will be disabled.", exc_info=True)
        # We don't raise here, we allow the server to start so the UI can still load, 
        # but the /analyze_resume endpoint will catch model failures later.

# ---- Request Models ----
class SkillGapRequest(BaseModel):
    role: str
    missing_skills: list[str]

class InterviewRequest(BaseModel):
    role: str
    extracted_skills: list[str]

class EvaluationRequest(BaseModel):
    role: str
    resume_score: float
    questions: list[str]
    answers: list[str]

@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.post("/upload_resume")
async def upload_resume(file: UploadFile = File(...)):
    """
    Endpoint just to upload and extract text for testing.
    """
    if not file.filename.lower().endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")
    
    # Storage Path Configuration
    file_location = os.path.join(UPLOADS_DIR, file.filename)
    try:
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(status_code=500, detail="Could not save file to disk.")
        
    try:
        with open(file_location, "rb") as f:
            contents = f.read()
        text = extract_text(contents, file.filename)
        return {"filename": file.filename, "saved_path": file_location, "extracted_text_preview": text[:200] + "..."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze_resume")
async def analyze_resume(role: str = Form(...), file: UploadFile = File(...)):
    """
    Endpoint to fully analyze the uploaded resume tailored to a specific role.
    """
    logger.info(f"Received file {file.filename} for role: {role}")
    
    if not file.filename.lower().endswith(('.pdf', '.docx')):
        logger.warning(f"Unsupported file type uploaded: {file.filename}")
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")
        
    # Storage Path Configuration
    file_location = os.path.join(UPLOADS_DIR, file.filename)
    try:
        with open(file_location, "wb+") as file_object:
            shutil.copyfileobj(file.file, file_object)
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(status_code=500, detail="Could not save file to disk.")
    
    with open(file_location, "rb") as f:
        contents = f.read()
    
    if len(contents) == 0:
        logger.warning("Empty file uploaded")
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        
    try:
        # 1. Extract raw text with dedicated error handling
        try:
            raw_text = await asyncio.to_thread(extract_text, contents, file.filename)
        except Exception as parse_err:
            logger.error(f"Failed to parse document {file.filename}: {parse_err}")
            raise HTTPException(status_code=400, detail="Oops! The resume could not be parsed. Please try saving it as a standard PDF or DOCX without password protection.")
            
        if not raw_text.strip():
            logger.warning("No extractable text found in file")
            raise HTTPException(status_code=400, detail="Could not extract any text from the provided file. It might be a scanned image or corrupted.")
            
        # Preview Text (first 300 words roughly)
        preview_text = " ".join(raw_text.split()[:300]) + ("..." if len(raw_text.split()) > 300 else "")
        
        # 2. Extract key skills
        skills = extract_skills(raw_text)
        
        # 3. Preprocess text
        # Offload heavy CPU string matching & regex to a background thread
        processed_text = await asyncio.to_thread(preprocess_text, raw_text)
        
        # 4. Predict suitability and score
        try:
            # Offload heavy ML inference to background thread
            score, decision, confidence = await asyncio.to_thread(predict_suitability, processed_text)
        except RuntimeError as e:
            logger.error(f"Model failure during prediction: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Machine Learning model error: {str(e)}")
            
        # 5. Get missing skills based on role selection
        missing_skills = get_missing_skills(role, skills)
            
        logger.info(f"Successfully analyzed {file.filename} -> {decision} ({score}/100)")
        
        return {
            "resume_score": score,
            "prediction": decision,
            "confidence": f"{confidence}%",
            "skills": skills,
            "missing_skills": missing_skills,
            "preview_text": preview_text
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during analysis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ---- LLM Integration Routes ----

@app.post("/skill_gap_analysis")
async def skill_gap_analysis(req: SkillGapRequest):
    """Generate roadmap via LLM for failing candidates"""
    try:
        roadmap = await asyncio.to_thread(generate_improvement_roadmap, req.role, req.missing_skills)
        return roadmap
    except Exception as e:
        logger.error(f"Error generating skill gap analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/start_interview")
async def start_interview(req: InterviewRequest):
    """Generate interview questions via LLM for passing candidates"""
    try:
        questions = await asyncio.to_thread(generate_interview_questions, req.role, req.extracted_skills)
        return {"questions": questions}
    except Exception as e:
        logger.error(f"Error generating questions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/evaluate_interview")
async def evaluate_interview_endpoint(req: EvaluationRequest):
    """Evaluate answers and compute final combined score"""
    try:
        evaluation = await asyncio.to_thread(evaluate_interview, req.role, req.questions, req.answers)
        
        interview_score = evaluation["score"]
        
        # Final Score = (Resume Score * 0.4) + (Interview Score * 0.6)
        final_score = round((req.resume_score * 0.4) + (interview_score * 0.6), 2)
        
        if final_score >= 80:
            decision = "Selected"
        elif final_score >= 60:
            decision = "Hold"
        else:
            decision = "Rejected"
            
        return {
            "interview_score": interview_score,
            "final_score": final_score,
            "decision": decision,
            "rationale": evaluation["rationale"],
            "feedback": evaluation["feedback"]
        }
    except Exception as e:
        logger.error(f"Error evaluating interview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate_report")
async def generate_report(data: dict = Body(...)):
    """
    Generates a PDF report dynamically based on the analysis results.
    """
    try:
        score = data.get("resume_score", 0)
        prediction = data.get("prediction", "N/A")
        confidence = data.get("confidence", "N/A")
        skills = data.get("skills", [])
        
        # Determine Color Based on Prediction
        primary_color = colors.HexColor("#10b981") if prediction == "Suitable" else colors.HexColor("#ef4444")
        
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Header
        c.setFont("Helvetica-Bold", 24)
        c.setFillColor(colors.HexColor("#1e3a8a"))
        c.drawString(50, height - 70, "HR Resume Analysis Report")
        
        # Underline
        c.setStrokeColor(colors.HexColor("#3b82f6"))
        c.setLineWidth(2)
        c.line(50, height - 80, width - 50, height - 80)
        
        # Results Section
        c.setFont("Helvetica-Bold", 14)
        c.setFillColor(colors.black)
        c.drawString(50, height - 120, "Prediction Result:")
        
        c.setFillColor(primary_color)
        c.drawString(180, height - 120, f"{prediction}")
        
        c.setFillColor(colors.black)
        c.drawString(50, height - 150, "Resume Score:")
        c.drawString(180, height - 150, f"{score} / 100")
        
        c.drawString(50, height - 180, "AI Confidence:")
        c.drawString(180, height - 180, f"{confidence}")
        
        # Skills Section
        c.drawString(50, height - 230, "Extracted Key Skills:")
        c.setFont("Helvetica", 12)
        
        y_pos = height - 250
        if skills:
            for skill in skills:
                c.drawString(70, y_pos, f"• {skill.capitalize()}")
                y_pos -= 20
                if y_pos < 50:
                    c.showPage()
                    y_pos = height - 50
                    c.setFont("Helvetica", 12)
        else:
            c.drawString(70, y_pos, "No key technical skills identified.")
        
        # Footer
        c.setFont("Helvetica-Oblique", 10)
        c.setFillColor(colors.gray)
        c.drawString(50, 30, "Generated automatically by AI HR Platform")
            
        c.save()
        buffer.seek(0)
        
        return StreamingResponse(
            buffer, 
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=Analysis_Report.pdf"}
        )
    except Exception as e:
        logger.error(f"Failed to generate PDF report: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate report")
