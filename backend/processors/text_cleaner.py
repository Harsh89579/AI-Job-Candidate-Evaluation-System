import re

def clean_text(text: str) -> str:
    """
    Clean extracted resume text by removing unwanted characters,
    URLs, emails, extra spaces, and normalizing content.
    """

    if not text:
        return ""

    # Remove URLs
    text = re.sub(r"http\S+|www\S+|https\S+", " ", text)

    # Remove emails
    text = re.sub(r"\S+@\S+\.\S+", " ", text)

    # Remove phone numbers
    text = re.sub(r"\b\d{10}\b", " ", text)  # basic phone format

    # Remove special characters except common resume symbols
    text = re.sub(r"[^a-zA-Z0-9.,;:()\-/%\s]", " ", text)

    # Replace multiple spaces/newlines
    text = re.sub(r"\s+", " ", text)

    # Trim
    return text.strip()
