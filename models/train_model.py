import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
import pickle
import os
import sys

# Add the parent directory to the python path so it can import utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.text_processing import preprocess_text

def create_synthetic_data():
    """
    Creates dummy data mimicking preprocessed resumes.
    Label 1 = Suitable, 0 = Not Suitable
    """
    data = {
        'text': [
            "experienced software engineer with strong python java machine learning skills worked at google aws certification project management",
            "entry level candidate know html css javascript looking for frontend role fast learner",
            "data scientist tensorflow pytorch scikit learn pandas big data experience master degree nlp deep learning",
            "project manager agile scrum leadership excellent communication skills pmp certified problem solving",
            "cashier at mcdonalds communication skills handled money retail experience",
            "high school graduate looking for job",
            "senior backend developer node js fastapi docker kubernetes 5 years experience sql mongodb aws",
            "delivery driver know how to drive fast great navigation skills",
            "devops engineer with 4 years experience in docker kubernetes terraform and ci/cd pipelines azure",
            "marketing intern with experience in social media and communication"
        ],
        'label': [1, 0, 1, 1, 0, 0, 1, 0, 1, 0] 
    }
    df = pd.DataFrame(data)
    # Preprocess the synthetic data
    df['text'] = df['text'].apply(preprocess_text)
    return df

def train_and_save_model():
    df = create_synthetic_data()
    
    # TF-IDF + Random Forest Pipeline
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(max_features=500)),
        ('clf', RandomForestClassifier(n_estimators=100, random_state=42))
    ])
    
    print("Training model...")
    pipeline.fit(df['text'], df['label'])
    
    # Save model
    os.makedirs('models', exist_ok=True)
    model_path = os.path.join('models', 'resume_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(pipeline, f)
        
    print(f"Model trained and saved to {model_path}")

if __name__ == "__main__":
    train_and_save_model()
