# Define the mandatory/core skills for various tech roles
# These are used to calculate the skill gap roadmap.

ROLE_SKILLS = {
    "Backend Developer": [
        "python", "java", "node.js", "sql", "postgresql", "mongodb", "docker", 
        "kubernetes", "fastapi", "django", "git", "linux", "aws", "ci/cd"
    ],
    "Frontend Developer": [
        "javascript", "typescript", "react", "angular", "vue", "html", "css", 
        "tailwind", "sass", "git", "figma", "testing", "api"
    ],
    "Data Scientist": [
        "python", "sql", "machine learning", "deep learning", "nlp", "pandas", 
        "numpy", "scikit-learn", "tensorflow", "pytorch", "statistics", "data visualization"
    ],
    "ML Engineer": [
        "python", "machine learning", "deep learning", "docker", "kubernetes", 
        "aws", "gcp", "tensorflow", "pytorch", "mlops", "ci/cd", "sql"
    ],
    "DevOps Engineer": [
        "linux", "bash", "aws", "azure", "gcp", "docker", "kubernetes", 
        "terraform", "ci/cd", "jenkins", "git", "python", "networking"
    ]
}

def get_missing_skills(role: str, extracted_skills: list[str]) -> list[str]:
    """
    Compare extracted candidate skills to required role skills
    """
    if role not in ROLE_SKILLS:
        return []
        
    required = set([s.lower() for s in ROLE_SKILLS[role]])
    extracted = set([s.lower() for s in extracted_skills])
    
    missing = required - extracted
    return sorted(list(missing))
