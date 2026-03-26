# 🚀 AI Resume Analyzer SaaS

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)
[![Gemini](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

**Production-ready AI-powered recruitment platform designed for modern HR workflows.**

[**Live Demo 🚀**](https://ai-job-candidate-evaluation-system.onrender.com/) | [**Documentation 📂**](#-features) | [**Author 👨‍💻**](#-author)

---

## 🚀 Live Demo
Experience the platform live: [AI Resume Analyzer SaaS](https://ai-job-candidate-evaluation-system.onrender.com/)

---

## ✨ Features

- 📄 **AI Resume Analysis**: Instant PDF/DOCX parsing with deep semantic evaluation of candidates.
- 🧠 **Skill Gap Detection**: Intelligent mapping of candidate skills against job requirements with automated roadmap generation.
- 🤖 **AI Interview System**: Dynamic technical question generation tailored to candidate profiles using Google Gemini.
- 🔐 **JWT Authentication**: Enterprise-grade secure login and signup with persistent session management.
- 🎨 **Modern SaaS UI**: Futuristic Dark Mode with Glassmorphism and responsive design.
- 📊 **Interactive Dashboard**: Real-time analytics and data visualization powered by Chart.js.
- ⚡ **Production Ready**: Fully optimized and deployed on Render for global accessibility.

---

## 🧠 System Architecture

The platform follows a modern decoupled architecture:

1.  **Frontend**: High-performance Vanilla JS and CSS for a sleek, fast user experience.
2.  **FastAPI Backend**: Secure REST API handling business logic, authentication, and file processing.
3.  **AI Engine**: Tight integration with Google Gemini for advanced language understanding and evaluation.
4.  **Database**: Reliable SQLite storage for user profiles and evaluation history.

---

## 🛠 Tech Stack

### Backend
- **Core**: FastAPI, Uvicorn
- **Security**: JWT (PyJWT), Passlib (Bcrypt_SHA256)
- **Database**: SQLite3
- **Environment**: Python Dotenv

### Frontend
- **Structure**: Semantic HTML5
- **Styling**: Vanilla CSS (Modern CSS Variables, Flexbox, Grid)
- **Logic**: ES6+ JavaScript, Chart.js

### AI/ML
- **Model**: Google Gemini API (`gemini-pro`)
- **Extraction**: PyPDF, python-docx, NLTK
- **Scoring**: Scikit-learn (Suitability Prediction)

### Deployment
- **Platform**: Render (Web Service)
- **CI/CD**: GitHub Integration

---

## 📸 Screenshots

![Dashboard](<img width="1900" height="921" alt="Screenshot 2026-03-25 181205" src="https://github.com/user-attachments/assets/05f33727-ca48-414b-84d1-d74534f29fa4" />
)
*Modern Glassmorphic Dashboard UI with real-time analytics.*

![Login](./screenshots/login.png)
*Secure Authenticated Access Portal.*

![Analytics](./screenshots/analytics.png)
*AI-Driven Skill Mapping and Gap Analysis.*

---

## ⚙️ Installation (Local Setup)

Prepare your local environment in minutes:

```bash
# 1. Clone the repository
git clone https://github.com/Harsh89579/AI-Job-Candidate-Evaluation-System.git
cd AI-Job-Candidate-Evaluation-System

# 2. Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# 3. Install production dependencies
pip install -r requirements.txt

# 4. Configure environment variables
# Create a .env file with:
# GEMINI_API_KEY=your_key
# JWT_SECRET=your_secret

# 5. Start the engine
uvicorn backend.main:app --reload
```

---

## 🌍 Deployment

The application is optimized for **Render**:
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port 10000`
- **Environment**: Configure `GEMINI_API_KEY`, `JWT_SECRET`, and `PYTHON_VERSION=3.12.9`.

---

## 🔒 Authentication Flow

We implement a secure **JWT-based Authentication Flow**:
1.  Users register/login via secure endpoints.
2.  The backend verifies credentials using `bcrypt_sha256` hashing.
3.  A signed JWT token is issued and stored securely in the frontend.
4.  Subsequent requests include the Bearer token for authorized access to AI features.

---

## 🚀 Future Improvements

- [ ] **Candidate History**: Persistent evaluation logs for recruiters.
- [ ] **Admin Dash**: Global insights and candidate comparison tools.
- [ ] **Custom Domains**: Professional branding and SSL management.
- [ ] **Enterprise AI**: Multi-model support (OpenAI/Anthropic) for diverse analysis.

---

## 👨‍💻 Author

**Harsh Tripathi**
[GitHub Profile](https://github.com/Harsh89579)

Developed with a focus on high-performance AI integration and premium UX.

