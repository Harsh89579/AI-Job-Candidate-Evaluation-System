# 🚀 AI Resume Analyzer SaaS (v1.0)

A high-performance, production-grade AI-powered recruitment platform designed to revolutionize the hiring process. Built with **FastAPI**, **Google Gemini AI**, and **Modern Glassmorphism UI**, this system automates candidate evaluation with precision and speed.

---

## ✨ Key Features

- 🔐 **Secure JWT Authentication**: Robust session management with persistent login states and automatic unauthorized redirection.
- 📊 **Intelligent Dashboard**: Real-time analytics with glassmorphic cards and interactive Chart.js visualizations.
- 📄 **Advanced Resume Parsing**: Instant PDF/DOCX text extraction using optimized NLP pipelines.
- 🤖 **AI-Driven Skill Gap Analysis**: Automatically detects missing technical skills and generates personalized upskilling roadmaps.
- 💬 **Dynamic AI Interview Portal**: Generates real-time, profile-specific technical questions using Gemini 2.5 Flash.
- 📈 **Candidate Suitability Scoring**: Proprietary ML-based logic to calculate overall hireability based on multiple heuristic vectors.
- 🛠️ **LLM Fallback System**: Seamless placeholder injection for 100% UI stability during API quota limits.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI (Python 3.9+), SQLite, JWT, Passlib (BCRYPT_SHA256)
- **Frontend**: Vanilla JS (ES6+), TailwindCSS principles, Chart.js, FontAwesome
- **AI/ML**: Google GenAI (Gemini 2.5 Flash), Scikit-Learn, NLTK
- **DevOps**: Docker ready, Environment-based configuration, Git

---

## 🚀 Getting Started

### 1. Initial Setup
```bash
# Clone the repository
git clone https://github.com/<your-username>/ai-resume-analyzer.git
cd ai-resume-analyzer

# Create virtual environment
python -m venv venv
source venv/bin/activate  # venv\Scripts\activate on Windows
```

### 2. Dependency Installation
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_actual_api_key_here
JWT_SECRET=your_ultra_secure_secret_key_random_string
```

### 4. Running the Application
```bash
# Start the production-ready server
uvicorn backend.main:app --reload
```
Navigate to `http://localhost:8000` to experience the intelligence.

---

## 📸 Preview
*Premium AI Dashboard with real-time analytics and dark-themed glassmorphism.*

---

## 🛡️ Security & Stability
- **Hashing**: Direct `passlib` patching to bypass legacy 72-byte bcrypt limits via `bcrypt_sha256`.
- **Database**: Integrated SQLite schema auto-initialization.
- **Error Handling**: Global JSON-mapped exception handling for zero-crash frontend experience.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Developed with ❤️ by [Harsh Tripathi](https://github.com/harsh89579)

