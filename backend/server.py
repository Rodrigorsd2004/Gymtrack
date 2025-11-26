from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
from datetime import datetime, timezone, date, time
import bcrypt
import jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client['GymTrack_DB']

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET', 'gymtrack_secret_key_change_in_production')
ALGORITHM = "HS256"

security = HTTPBearer()

# Create the main app
app = FastAPI(title="GymTrack API")
api_router = APIRouter(prefix="/api")

# ===================== MODELS =====================

class Admin(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id_admin: str
    nome: str
    email: EmailStr

class AdminCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str

class LoginRequest(BaseModel):
    email: EmailStr
    senha: str

class LoginResponse(BaseModel):
    token: str
    admin: Admin

class Aluno(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id_aluno: str
    nome: str
    endereco: Optional[str] = None
    idade: int
    email: Optional[EmailStr] = None

class AlunoCreate(BaseModel):
    nome: str
    endereco: Optional[str] = None
    idade: int
    email: Optional[EmailStr] = None

class AlunoUpdate(BaseModel):
    nome: Optional[str] = None
    endereco: Optional[str] = None
    idade: Optional[int] = None
    email: Optional[EmailStr] = None

class Instrutor(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id_instrutor: str
    nome: str
    idade: int
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None

class InstrutorCreate(BaseModel):
    nome: str
    idade: int
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None

class InstrutorUpdate(BaseModel):
    nome: Optional[str] = None
    idade: Optional[int] = None
    email: Optional[EmailStr] = None
    telefone: Optional[str] = None

class Agenda(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id_agenda: str
    data: str
    hora_inicio: str
    hora_fim: str
    disponivel: bool
    instrutor_id_instrutor: str
    instrutor_nome: Optional[str] = None

class AgendaCreate(BaseModel):
    data: str
    hora_inicio: str
    hora_fim: str
    disponivel: bool = True
    instrutor_id_instrutor: str

class AgendaUpdate(BaseModel):
    data: Optional[str] = None
    hora_inicio: Optional[str] = None
    hora_fim: Optional[str] = None
    disponivel: Optional[bool] = None
    instrutor_id_instrutor: Optional[str] = None

class Treino(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id_treino: str
    tipo_treino: str  # 'Simples' ou 'Personalizado'
    nome_treino: str
    aluno_id_aluno: str
    aluno_nome: Optional[str] = None
    agenda_id_agenda: Optional[str] = None
    descricao: Optional[str] = None
    nivel: Optional[str] = None
    duracao: Optional[str] = None

class TreinoCreate(BaseModel):
    tipo_treino: str
    nome_treino: str
    aluno_id_aluno: str
    agenda_id_agenda: Optional[str] = None
    descricao: Optional[str] = None
    nivel: Optional[str] = None
    duracao: Optional[str] = None

class TreinoUpdate(BaseModel):
    tipo_treino: Optional[str] = None
    nome_treino: Optional[str] = None
    aluno_id_aluno: Optional[str] = None
    agenda_id_agenda: Optional[str] = None
    descricao: Optional[str] = None
    nivel: Optional[str] = None
    duracao: Optional[str] = None

class DashboardStats(BaseModel):
    total_alunos: int
    total_instrutores: int
    total_agendas: int
    total_treinos: int
    agendas_disponiveis: int

# ===================== AUTH MIDDLEWARE =====================

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id = payload.get("admin_id")
        if not admin_id:
            raise HTTPException(status_code=401, detail="Token inválido")
        return admin_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

# ===================== AUTHENTICATION =====================

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    admin = await db.admins.find_one({"email": request.email})
    
    if not admin:
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Verify password
    if not bcrypt.checkpw(request.senha.encode('utf-8'), admin['senha'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
    # Generate JWT token
    token = jwt.encode(
        {"admin_id": str(admin['_id']), "email": admin['email']},
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    
    return {
        "token": token,
        "admin": {
            "id_admin": str(admin['_id']),
            "nome": admin['nome'],
            "email": admin['email']
        }
    }

@api_router.get("/auth/me", response_model=Admin)
async def get_current_admin(admin_id: str = Depends(verify_token)):
    admin = await db.admins.find_one({"_id": ObjectId(admin_id)})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin não encontrado")
    
    return {
        "id_admin": str(admin['_id']),
        "nome": admin['nome'],
        "email": admin['email']
    }

# ===================== DASHBOARD =====================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(admin_id: str = Depends(verify_token)):
    total_alunos = await db.alunos.count_documents({})
    total_instrutores = await db.instrutores.count_documents({})
    total_agendas = await db.agendas.count_documents({})
    total_treinos = await db.treinos.count_documents({})
    agendas_disponiveis = await db.agendas.count_documents({"disponivel": True})
    
    return {
        "total_alunos": total_alunos,
        "total_instrutores": total_instrutores,
        "total_agendas": total_agendas,
        "total_treinos": total_treinos,
        "agendas_disponiveis": agendas_disponiveis
    }

# ===================== ALUNOS CRUD =====================

@api_router.get("/alunos", response_model=List[Aluno])
async def get_alunos(admin_id: str = Depends(verify_token)):
    alunos = await db.alunos.find({}).to_list(1000)
    return [{**aluno, "id_aluno": str(aluno['_id'])} for aluno in alunos]

@api_router.post("/alunos", response_model=Aluno)
async def create_aluno(aluno: AlunoCreate, admin_id: str = Depends(verify_token)):
    if aluno.idade < 7:
        raise HTTPException(status_code=400, detail="Idade mínima é 7 anos")
    
    if aluno.email:
        existing = await db.alunos.find_one({"email": aluno.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    result = await db.alunos.insert_one(aluno.model_dump())
    created = await db.alunos.find_one({"_id": result.inserted_id})
    return {**created, "id_aluno": str(created['_id'])}

@api_router.put("/alunos/{id_aluno}", response_model=Aluno)
async def update_aluno(id_aluno: str, aluno: AlunoUpdate, admin_id: str = Depends(verify_token)):
    update_data = {k: v for k, v in aluno.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    if 'idade' in update_data and update_data['idade'] < 7:
        raise HTTPException(status_code=400, detail="Idade mínima é 7 anos")
    
    result = await db.alunos.update_one(
        {"_id": ObjectId(id_aluno)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    updated = await db.alunos.find_one({"_id": ObjectId(id_aluno)})
    return {**updated, "id_aluno": str(updated['_id'])}

@api_router.delete("/alunos/{id_aluno}")
async def delete_aluno(id_aluno: str, admin_id: str = Depends(verify_token)):
    result = await db.alunos.delete_one({"_id": ObjectId(id_aluno)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    # Delete associated treinos
    await db.treinos.delete_many({"aluno_id_aluno": id_aluno})
    
    return {"message": "Aluno deletado com sucesso"}

# ===================== INSTRUTORES CRUD =====================

@api_router.get("/instrutores", response_model=List[Instrutor])
async def get_instrutores(admin_id: str = Depends(verify_token)):
    instrutores = await db.instrutores.find({}).to_list(1000)
    return [{**instrutor, "id_instrutor": str(instrutor['_id'])} for instrutor in instrutores]

@api_router.post("/instrutores", response_model=Instrutor)
async def create_instrutor(instrutor: InstrutorCreate, admin_id: str = Depends(verify_token)):
    if instrutor.idade < 18:
        raise HTTPException(status_code=400, detail="Idade mínima para instrutor é 18 anos")
    
    if instrutor.email:
        existing = await db.instrutores.find_one({"email": instrutor.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    result = await db.instrutores.insert_one(instrutor.model_dump())
    created = await db.instrutores.find_one({"_id": result.inserted_id})
    return {**created, "id_instrutor": str(created['_id'])}

@api_router.put("/instrutores/{id_instrutor}", response_model=Instrutor)
async def update_instrutor(id_instrutor: str, instrutor: InstrutorUpdate, admin_id: str = Depends(verify_token)):
    update_data = {k: v for k, v in instrutor.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    if 'idade' in update_data and update_data['idade'] < 18:
        raise HTTPException(status_code=400, detail="Idade mínima para instrutor é 18 anos")
    
    result = await db.instrutores.update_one(
        {"_id": ObjectId(id_instrutor)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Instrutor não encontrado")
    
    updated = await db.instrutores.find_one({"_id": ObjectId(id_instrutor)})
    return {**updated, "id_instrutor": str(updated['_id'])}

@api_router.delete("/instrutores/{id_instrutor}")
async def delete_instrutor(id_instrutor: str, admin_id: str = Depends(verify_token)):
    result = await db.instrutores.delete_one({"_id": ObjectId(id_instrutor)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Instrutor não encontrado")
    
    # Delete associated agendas
    await db.agendas.delete_many({"instrutor_id_instrutor": id_instrutor})
    
    return {"message": "Instrutor deletado com sucesso"}

# ===================== AGENDAS CRUD =====================

@api_router.get("/agendas", response_model=List[Agenda])
async def get_agendas(admin_id: str = Depends(verify_token)):
    agendas = await db.agendas.find({}).to_list(1000)
    result = []
    
    for agenda in agendas:
        instrutor = await db.instrutores.find_one({"_id": ObjectId(agenda['instrutor_id_instrutor'])})
        result.append({
            **agenda,
            "id_agenda": str(agenda['_id']),
            "instrutor_nome": instrutor['nome'] if instrutor else "Instrutor não encontrado"
        })
    
    return result

@api_router.post("/agendas", response_model=Agenda)
async def create_agenda(agenda: AgendaCreate, admin_id: str = Depends(verify_token)):
    # Verify instrutor exists
    instrutor = await db.instrutores.find_one({"_id": ObjectId(agenda.instrutor_id_instrutor)})
    if not instrutor:
        raise HTTPException(status_code=404, detail="Instrutor não encontrado")
    
    # Validate time
    if agenda.hora_fim <= agenda.hora_inicio:
        raise HTTPException(status_code=400, detail="Hora de fim deve ser maior que hora de início")
    
    result = await db.agendas.insert_one(agenda.model_dump())
    created = await db.agendas.find_one({"_id": result.inserted_id})
    
    return {
        **created,
        "id_agenda": str(created['_id']),
        "instrutor_nome": instrutor['nome']
    }

@api_router.put("/agendas/{id_agenda}", response_model=Agenda)
async def update_agenda(id_agenda: str, agenda: AgendaUpdate, admin_id: str = Depends(verify_token)):
    update_data = {k: v for k, v in agenda.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    if 'instrutor_id_instrutor' in update_data:
        instrutor = await db.instrutores.find_one({"_id": ObjectId(update_data['instrutor_id_instrutor'])})
        if not instrutor:
            raise HTTPException(status_code=404, detail="Instrutor não encontrado")
    
    result = await db.agendas.update_one(
        {"_id": ObjectId(id_agenda)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agenda não encontrada")
    
    updated = await db.agendas.find_one({"_id": ObjectId(id_agenda)})
    instrutor = await db.instrutores.find_one({"_id": ObjectId(updated['instrutor_id_instrutor'])})
    
    return {
        **updated,
        "id_agenda": str(updated['_id']),
        "instrutor_nome": instrutor['nome'] if instrutor else "Instrutor não encontrado"
    }

@api_router.delete("/agendas/{id_agenda}")
async def delete_agenda(id_agenda: str, admin_id: str = Depends(verify_token)):
    result = await db.agendas.delete_one({"_id": ObjectId(id_agenda)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Agenda não encontrada")
    
    return {"message": "Agenda deletada com sucesso"}

# ===================== TREINOS CRUD =====================

@api_router.get("/treinos", response_model=List[Treino])
async def get_treinos(admin_id: str = Depends(verify_token)):
    treinos = await db.treinos.find({}).to_list(1000)
    result = []
    
    for treino in treinos:
        aluno = await db.alunos.find_one({"_id": ObjectId(treino['aluno_id_aluno'])})
        result.append({
            **treino,
            "id_treino": str(treino['_id']),
            "aluno_nome": aluno['nome'] if aluno else "Aluno não encontrado"
        })
    
    return result

@api_router.post("/treinos", response_model=Treino)
async def create_treino(treino: TreinoCreate, admin_id: str = Depends(verify_token)):
    # Verify aluno exists
    aluno = await db.alunos.find_one({"_id": ObjectId(treino.aluno_id_aluno)})
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    # Verify agenda if provided
    if treino.agenda_id_agenda:
        agenda = await db.agendas.find_one({"_id": ObjectId(treino.agenda_id_agenda)})
        if not agenda:
            raise HTTPException(status_code=404, detail="Agenda não encontrada")
    
    result = await db.treinos.insert_one(treino.model_dump())
    created = await db.treinos.find_one({"_id": result.inserted_id})
    
    return {
        **created,
        "id_treino": str(created['_id']),
        "aluno_nome": aluno['nome']
    }

@api_router.put("/treinos/{id_treino}", response_model=Treino)
async def update_treino(id_treino: str, treino: TreinoUpdate, admin_id: str = Depends(verify_token)):
    update_data = {k: v for k, v in treino.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    if 'aluno_id_aluno' in update_data:
        aluno = await db.alunos.find_one({"_id": ObjectId(update_data['aluno_id_aluno'])})
        if not aluno:
            raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    result = await db.treinos.update_one(
        {"_id": ObjectId(id_treino)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    
    updated = await db.treinos.find_one({"_id": ObjectId(id_treino)})
    aluno = await db.alunos.find_one({"_id": ObjectId(updated['aluno_id_aluno'])})
    
    return {
        **updated,
        "id_treino": str(updated['_id']),
        "aluno_nome": aluno['nome'] if aluno else "Aluno não encontrado"
    }

@api_router.delete("/treinos/{id_treino}")
async def delete_treino(id_treino: str, admin_id: str = Depends(verify_token)):
    result = await db.treinos.delete_one({"_id": ObjectId(id_treino)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    
    return {"message": "Treino deletado com sucesso"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
    # Create default admin if not exists
    existing_admin = await db.admins.find_one({"email": "admin@gymtrack.com"})
    if not existing_admin:
        hashed = bcrypt.hashpw("admin123".encode('utf-8'), bcrypt.gensalt())
        await db.admins.insert_one({
            "nome": "Administrador",
            "email": "admin@gymtrack.com",
            "senha": hashed.decode('utf-8')
        })
        logger.info("Admin padrão criado: admin@gymtrack.com / admin123")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()