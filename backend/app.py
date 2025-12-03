from fastapi import FastAPI, UploadFile, File
import shutil
from resume_parser import parse_resume



app = FastAPI()

@app.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    # temporary file name
    temp_path = f"temp_{file.filename}"

    # save uploaded file to disk
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # parse resume
    data = parse_resume(temp_path)

    return {
        "status": "success",
        "filename": file.filename,
        "parsed_data": data
    }



