import re

def clean_text(text):
    text = text.lower()

    text = re.sub(r'http\S+|www.\S+', '', text)

    text = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z.-]+\.[a-zA-Z]{2,}', '', text)

    text = re.sub(r'\+?\d[\d -]{8,12}\d', '', text)

    text = re.sub(r'[^a-z0-9 \n]', ' ', text)

    text = re.sub(r'\s+', ' ', text).strip()

    return text
