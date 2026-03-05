import os
import logging
import json
from google import genai
from google.genai import types
from pydantic import BaseModel
from dotenv import load_dotenv

logger = logging.getLogger("HR_API")
load_dotenv()

# Initialize Client
_api_key = os.getenv("GEMINI_API_KEY")

if not _api_key:
    logger.warning("GEMINI_API_KEY is missing from environment variables.")
    client = None
    LLM_AVAILABLE = False
else:
    try:
        # Using the standardized google-genai SDK
        client = genai.Client(api_key=_api_key)
        LLM_AVAILABLE = True
    except Exception as e:
        logger.warning(f"Failed to initialize Gemini Client: {e}")
        client = None
        LLM_AVAILABLE = False


# ---- Pydantic Schemas for Structured JSON Output ----
class RoadmapItem(BaseModel):
    title: str
    description: str

class SkillGapResponse(BaseModel):
    message: str
    roadmap: list[RoadmapItem]

class InterviewQuestionsResponse(BaseModel):
    questions: list[str]

class InterviewEvaluationResponse(BaseModel):
    score: int
    rationale: str
    feedback: str


# ---- Core Functions Abstracted around Provider ----

def _generate_structured_content(prompt: str, schema_class: type[BaseModel]) -> BaseModel:
    """Internal helper to abstract the specific LLM call"""
    if not LLM_AVAILABLE:
        raise RuntimeError("LLM service unavailable. Please configure GEMINI_API_KEY.")
        
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema_class,
                temperature=0.3
            ),
        )
        # Parse the structured JSON the LLM guarantees to return
        return schema_class.model_validate_json(response.text)
    except Exception as e:
        logger.error(f"LLM Generation Error: {e}")
        raise RuntimeError(f"Failed to communicate with LLM Provider: {e}")


def generate_improvement_roadmap(role: str, missing_skills: list[str]) -> dict:
    """Generate a step-by-step learning roadmap for missing skills"""
    missing_str = ", ".join(missing_skills)
    prompt = f"""
    You are an expert tech recruiter and mentor. 
    The candidate is applying for the role of '{role}'.
    They are missing the following key skills: {missing_str}.
    
    Provide a professional, encouraging message, and lay out a short 3-step learning roadmap 
    on how they can quickly upskill in these specific areas to become eligible for an AI Interview next time.
    """
    result = _generate_structured_content(prompt, SkillGapResponse)
    return result.model_dump()


def generate_interview_questions(role: str, extracted_skills: list[str]) -> list[str]:
    """Generate 5 tech interview questions based on role and skills"""
    skills_str = ", ".join(extracted_skills)
    prompt = f"""
    You are an expert technical interviewer.
    Generate exactly 5 job-role specific technical interview questions for a '{role}'.
    
    The candidate claims these skills on their resume: {skills_str}.
    Ensure the questions test their depth in these specific technologies and their general 
    understanding of {role} architectures.
    
    Do not provide the answers. Just the questions.
    """
    result = _generate_structured_content(prompt, InterviewQuestionsResponse)
    return result.questions


def evaluate_interview(role: str, questions: list[str], answers: list[str]) -> dict:
    """Evaluate candidate answers and score 0-100"""
    qa_pairs = ""
    for idx, (q, a) in enumerate(zip(questions, answers)):
        qa_pairs += f"Q{idx+1}: {q}\nCandidate Answer: {a}\n\n"
        
    prompt = f"""
    You are a strict technical hiring manager evaluating an interview for a '{role}'.
    
    Evaluate the following Q&A transcript based on:
    - Technical Depth
    - Relevance to the question
    - Clarity of communication
    
    Transcript:
    {qa_pairs}
    
    Provide an integer score from 0-100 representing their overall performance.
    Provide a brief rationale for the score, and 1 short sentence of actionable feedback.
    """
    result = _generate_structured_content(prompt, InterviewEvaluationResponse)
    return result.model_dump()
