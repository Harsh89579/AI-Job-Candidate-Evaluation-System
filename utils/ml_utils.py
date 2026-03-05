import pickle
import os
import logging

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
model_path = os.path.join(BASE_DIR, 'models', 'resume_model.pkl')
pipeline = None

def load_model():
    global pipeline
    if os.path.exists(model_path):
        try:
            with open(model_path, 'rb') as f:
                pipeline = pickle.load(f)
            logger.info("Model loaded successfully.")
        except Exception as e:
            logger.error(f"Error loading model: {e}", exc_info=True)
            raise RuntimeError(f"Failed to load ML model: {e}") from e
    else:
        logger.error(f"Model file not found at {model_path}.")
        raise FileNotFoundError(f"Model file not found at {model_path}. Please train the model first.")

def predict_suitability(preprocessed_text):
    if pipeline is None:
        try:
            load_model()
        except Exception as e:
            raise RuntimeError(f"Model Not Loaded: {e}")
            
    if pipeline is None:
        raise RuntimeError("Model Not Loaded")
        
    try:
        # Predict probabilities
        prob = pipeline.predict_proba([preprocessed_text])[0]
        
        # Assume class 1 is "Suitable"
        score = round(prob[1] * 100, 2)
        prediction = "Suitable" if prob[1] >= 0.5 else "Not Suitable"
        
        # Confidence is just the highest probability
        confidence = round(max(prob) * 100, 2)
        
        return score, prediction, confidence
    except Exception as e:
        logger.error(f"Error during prediction: {e}", exc_info=True)
        raise RuntimeError(f"Prediction failed: {e}") from e
