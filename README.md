# 🧬 AI-Job-Candidate-Evaluation-System

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Scikit-Learn](https://img.shields.io/badge/ML-Scikit--Learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)

An automated recruitment tool that leverages Machine Learning to bridge the gap between candidate resumes and job requirements. This project automates the screening process, ranking candidates based on their skill sets, experience, and relevance to specific roles.

## 🌟 Core Functionality

- **Resume Parsing**: Automatically extracts key information from PDF/Docx resumes.
- **Skill Matching**: Uses NLP and ML models to calculate similarity scores between JD and CV.
- **Automated Ranking**: Provides a ranked list of candidates to help recruiters prioritize.
- **Scalable Backend**: Built with FastAPI for high-performance API handling.

## 🛠 Tech Stack

- **Backend**: FastAPI (Python)
- **Machine Learning**: Scikit-learn, Pandas, NLTK
- **Frontend**: HTML5, CSS3, JavaScript
- **Data Handling**: PyPDF2 / Docx2txt for document extraction

## 📂 Repository Structure

```text
├── backend/            # Main FastAPI server logic
├── models/             # Trained ML models and encoders
├── uploads/            # Temporary storage for processed resumes
├── utils/              # Helper functions for text cleaning
├── test_script.py      # Automated testing for ML logic
└── requirements.txt    # Project dependencies
```

## ⚙️ Installation & Usage

1. **Clone & Install**:
   ```bash
   git clone https://github.com/Harsh89579/AI-Job-Candidate-Evaluation-System.git
   cd AI-Job-Candidate-Evaluation-System
   pip install -r requirements.txt
   ```

2. **Run Server**:
   ```bash
   uvicorn backend.main:app --reload
   ```

3. **In the Browser**:
   Navigate to `http://127.0.0.1:8000/docs` to test the API endpoints interactively.

## 🔮 Roadmap

- [ ] Implementation of BERT-based embeddings for deeper semantic matching.
- [ ] Integration with LinkedIn API for real-time candidate data.
- [ ] Dashboard for visual analytics on candidate pools.

---
**Author**: [Harsh Tripathi](https://github.com/Harsh89579)
