# 🚀 AI Resume Analyzer SaaS

AI-powered recruitment platform for resume analysis, skill gap detection, and interview preparation.

---

## 🔥 Features

- 🔐 **JWT Authentication**: Secure Login/Signup with persistent session management.
- 📄 **Resume Upload & Analysis**: Instant PDF/DOCX parsing and semantic text extraction.
- 📊 **AI-powered Dashboard**: Interactive insights with dark-themed analytics and Chart.js.
- 🧠 **Skill Gap Detection & Roadmap**: Automated gap analysis with dynamic learning roadmaps.
- 🤖 **AI Interview Question Generator**: Profile-specific technical evaluation using Gemini AI.
- ⚡ **LLM Fallback System**: Professional placeholder injection to handle API quota failures.
- 🎨 **Modern SaaS UI**: Premium Glassmorphism design with a dark, futuristic aesthetic.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python)
- **Frontend**: HTML5, Vanilla CSS, JavaScript (ES6+)
- **Database**: SQLite3
- **Authentication**: JWT (PyJWT) + Passlib (BCRYPT_SHA256)
- **AI Engine**: Google Gemini API (with robust offline fallback system)

---

## 📸 Preview

![Dashboard UI](https://via.placeholder.com/800x450/020617/ffffff?text=Dashboard+UI+Glassmorphism)
*Premium AI Dashboard with real-time analytics.*

![Login Page](https://via.placeholder.com/800x450/020617/ffffff?text=Login+Portal+Design)
*Secure Authenticated Access Portal.*

![Resume Analysis](https://via.placeholder.com/800x450/020617/ffffff?text=Resume+Analysis+Portal)
*AI-Driven Skill Extraction & Mapping.*

---

## 🚀 How to Run Locally

### 1. Clone & Navigate
```bash
git clone https://github.com/Harsh89579/AI-Job-Candidate-Evaluation-System.git
cd AI-Job-Candidate-Evaluation-System
```

### 2. Environment Setup
```bash
# Create virtual environment
python -m venv venv

# Activate environment (Windows)
venv\Scripts\activate
```

### 3. Dependency Installation
```bash
pip install -r requirements.txt
```

### 4. Start the Application
```bash
uvicorn backend.main:app --reload
```
Open **http://localhost:8000** to begin.

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_actual_api_key_here
JWT_SECRET=your_custom_secure_secret_key
```

---

## 📂 Project Structure

```text
backend/
  ├── main.py       # Core API & Application Logic
  ├── auth.py       # JWT Security & User Management
  ├── static/       # CSS/JS Assets & Charting logic
  ├── templates/    # UI Templates (HTML/JS)
utils/              # AI Helpers & ML Utilities
models/             # Pre-trained Skill Predictors
```

---

## 💡 Key Highlights

- **Full-Stack AI Integration**: Seamless connection between FastAPI and Google's LLM ecosystem.
- **Production-Ready Security**: Implemented robust JWT tokenization and password hashing.
- **Fail-Safe Reliability**: Handled real-world API rate limits with intelligent fallback logic.
- **Stunning UX**: Designed a high-conversion, modern SaaS dashboard with 100% responsiveness.

---

## 🚀 Future Improvements

- ☁️ **Cloud Deployment**: Migration to Render/Vercel for global availability.
- 👥 **Multi-Tenant System**: Support for multiple HR organizations.
- 🛠️ **Admin Control Panel**: Advanced candidate management and report exports.

---

## 👨‍💻 Author

**Harsh Tripathi**
[GitHub Profile](https://github.com/Harsh89579)

---
*Developed with ❤️ as a high-performance AI recruitment solution.*

