# AI Job Candidate Evaluation System

## Project Overview
The AI Job Candidate Evaluation System is a comprehensive, AI-powered platform designed to streamline the recruitment process. It automatically parses candidate resumes, analyzes their skills against job requirements, identifies skill gaps, and dynamically generates tailored AI interview questions to evaluate candidates effectively.

## Key Features
- **Resume Analysis**: Upload and parse candidate resumes (PDF/DOCX) to extract essential details and skills.
- **Skill Gap Detection**: Automatically compares extracted skills with job descriptions to identify missing skills and provide a customized learning roadmap.
- **AI Interview Question Generation**: Generates contextual technical questions using an LLM based on the candidate's exact profile.
- **Candidate Evaluation**: Evaluates answers dynamically and calculates a suitability score for the specified technical role.

## Tech Stack
- **Python**
- **FastAPI** (Backend framework)
- **Streamlit** (Optional/Future Frontend integration) / HTML+JS SPA
- **NLP** (Natural Language Processing for text extraction)
- **ML** (Machine Learning for suitability classification)
- **Google Gemini LLM** (For dynamic interview generation)

## Installation Steps
1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/ai-job-candidate-evaluation-system.git
   cd ai-job-candidate-evaluation-system
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Linux/Mac:
   source venv/bin/activate
   ```

3. **Install the dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

## How to Run the Project
1. **Train the Machine Learning Model (if needed):**
   ```bash
   python models/train_model.py
   ```
2. **Start the FastAPI server:**
   ```bash
   uvicorn backend.main:app --reload
   ```
3. **Access the application:**
   Open your browser and navigate to `http://localhost:8000` to use the platform.

## Screenshots
*(Add screenshots of the Resume Analyzer Dashboard, Skill Gap Roadmap, and AI Live Interview interface here.)*

## Future Improvements
- Integrate a full Streamlit dashboard for deeper analytics.
- Add support for multiple LLM providers (OpenAI, Anthropic).
- Implement user authentication for recruiters and candidates.
- Export detailed evaluation reports as specialized PDF or CSV formats.
