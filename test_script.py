import requests
from reportlab.pdfgen import canvas

# Create a test PDF
c = canvas.Canvas("test_resume.pdf")
c.drawString(100, 750, "John Doe")
c.drawString(100, 730, "Software Engineer with 5 years of Python, FastAPI, and React experience.")
c.save()

# Send to API
url = "http://127.0.0.1:8000/analyze_resume"
files = {'file': open('test_resume.pdf', 'rb')}
data = {'role': 'Backend Developer'}

try:
    response = requests.post(url, files=files, data=data)
    print("Status Code:", response.status_code)
    print("Response Context:", response.text)
except Exception as e:
    print("Error:", e)
