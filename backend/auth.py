from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import sqlite3
import os
from jose import jwt
from passlib.context import CryptContext
import passlib.handlers.bcrypt
import bcrypt

try:
    bcrypt.__about__
except AttributeError:
    class _BcryptAbout:
        __version__ = getattr(bcrypt, '__version__', '4.0.0')
    bcrypt.__about__ = _BcryptAbout()

pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")

# Force passlib to evaluate its lazy-loaders globally into memory.
try:
    pwd_context.hash("dummy_init")
except ValueError:
    pass

# NOW that the backend is permanently loaded, structurally override the bug check!
passlib.handlers.bcrypt.detect_wrap_bug = lambda *args, **kwargs: False
SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_ai_hr_vision_key_999") 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

pwd_context = CryptContext(schemes=["bcrypt_sha256"], deprecated="auto")
print(f"Active passlib schemas: {pwd_context.schemes()}")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

router = APIRouter(prefix="/auth", tags=["auth"])

# DB Setup
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "users.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            role TEXT DEFAULT 'hr'
        )
    """)
    conn.commit()
    conn.close()

init_db()

# Models
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserResponse(BaseModel):
    name: str
    email: str
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str
    name: str

# Helper functions
def get_user(email: str):
    init_db()  # Auto-recreate schema if db files are deleted while server is running
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, name, email, hashed_password, role FROM users WHERE email=?", (email,))
    user = c.fetchone()
    conn.close()
    if user:
        return {"id": user[0], "name": user[1], "email": user[2], "hashed_password": user[3], "role": user[4]}
    return None

def hash_password(password: str):
    print(f"[DEBUG] Password length before hashing: {len(password)}")
    return pwd_context.hash(password)

def verify_password(password: str, hashed_password: str):
    return pwd_context.verify(password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    user = get_user(email=email)
    if user is None:
        raise credentials_exception
    return user

# Routes
@router.post("/register")
async def register(user: UserCreate):
    print("Incoming data:", user)
    try:
        init_db()  # Ensure table exists safely
        existing_user = get_user(user.email)
        if existing_user:
            return {"error": "Email already exists"}
        
        hashed_password = hash_password(user.password)
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        try:
            c.execute("INSERT INTO users (name, email, hashed_password) VALUES (?, ?, ?)", 
                      (user.name, user.email, hashed_password))
            conn.commit()
        except sqlite3.IntegrityError:
            conn.close()
            return {"error": "Email already exists"}
        conn.close()
            
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {"message": "User created successfully", "access_token": access_token, "token_type": "bearer", "name": user.name}
    except Exception as e:
        print("REGISTER ERROR:", e)
        return {"error": str(e)}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return {
        "status": "success",
        "email": current_user["email"],
        "name": current_user["name"],
        "role": current_user["role"]
    }

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    print(f"[DEBUG] Incoming Login: {form_data.username}")
    try:
        user = get_user(form_data.username) # OAuth2 uses 'username' for the identifier
        if not user or not verify_password(form_data.password, user['hashed_password']):
            return JSONResponse(status_code=401, content={"error": "Incorrect email or password"})
            
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["email"]}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer", "name": user["name"]}
    except Exception as e:
        import traceback
        print(f"[AUTH ERROR /login]: {traceback.format_exc()}")
        return JSONResponse(status_code=500, content={"error": str(e)})


