import re

# Comprehensive list of skills commonly found in resumes
# In a real-world scenario, this might be loaded from a database or a file.
KNOWN_SKILLS = [
    "python", "java", "c++", "c#", "javascript", "typescript", "react", "angular", "vue", "node.js", "express",
    "sql", "mysql", "postgresql", "mongodb", "nosql", "redis",
    "machine learning", "deep learning", "data science", "nlp", "computer vision",
    "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd",
    "fastapi", "django", "flask", "spring boot", "ruby on rails",
    "html", "css", "sass", "tailwind", "git", "github", "gitlab", "bitbucket",
    "linux", "unix", "bash", "agile", "scrum", "kanban",
    "communication", "leadership", "project management", "problem solving",
    "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy", "matplotlib", "seaborn",
    "pmp", "aws certified", "cisco", "comptia"
]

def extract_skills(text):
    text_lower = text.lower()
    found_skills = []
    
    for skill in KNOWN_SKILLS:
        # Match word boundaries to prevent partial word matches
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.append(skill)
            
    return sorted(list(set(found_skills)))
