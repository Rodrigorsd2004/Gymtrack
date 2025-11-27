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

# Nova estrutura de Agenda (Horário Fixo)
class AgendaFixa(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id_agenda: str
    instrutor_id_instrutor: str
    instrutor_nome: Optional[str] = None
    dias_semana: str  # Ex: "Seg-Sex", "Seg, Qua, Sex"
    hora_inicio: str
    hora_fim: str
    disponivel: bool

class AgendaFixaCreate(BaseModel):
    instrutor_id_instrutor: str
    dias_semana: str
    hora_inicio: str
    hora_fim: str
    disponivel: bool = True

class AgendaFixaUpdate(BaseModel):
    instrutor_id_instrutor: Optional[str] = None
    dias_semana: Optional[str] = None
    hora_inicio: Optional[str] = None
    hora_fim: Optional[str] = None
    disponivel: Optional[bool] = None

# Nova estrutura de Treino
class Treino(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id_treino: str
    tipo_treino: str
    nome_treino: str
    aluno_id_aluno: str
    aluno_nome: Optional[str] = None
    # Campos para treino personalizado
    data: Optional[str] = None
    hora_inicio: Optional[str] = None
    hora_fim: Optional[str] = None
    instrutor_id_instrutor: Optional[str] = None
    instrutor_nome: Optional[str] = None
    descricao: Optional[str] = None
    nivel: Optional[str] = None
    concluido: bool = False

class TreinoCreate(BaseModel):
    tipo_treino: str
    nome_treino: str
    aluno_id_aluno: str
    # Campos opcionais para personalizado
    data: Optional[str] = None
    hora_inicio: Optional[str] = None
    hora_fim: Optional[str] = None
    instrutor_id_instrutor: Optional[str] = None
    descricao: Optional[str] = None
    nivel: Optional[str] = None

class TreinoUpdate(BaseModel):
    tipo_treino: Optional[str] = None
    nome_treino: Optional[str] = None
    aluno_id_aluno: Optional[str] = None
    data: Optional[str] = None
    hora_inicio: Optional[str] = None
    hora_fim: Optional[str] = None
    instrutor_id_instrutor: Optional[str] = None
    descricao: Optional[str] = None
    nivel: Optional[str] = None
    concluido: Optional[bool] = None

class InstrutorDisponivel(BaseModel):
    id_instrutor: str
    nome: str
    idade: int

class DashboardStats(BaseModel):
    total_alunos: int
    total_instrutores: int
    total_agendas: int
    total_treinos: int
    agendas_disponiveis: int

class InstrutorComHorario(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id_instrutor: str
    nome: str
    idade: int
    email: Optional[str] = None
    telefone: Optional[str] = None
    dias_semana: Optional[str] = None
    horario: Optional[str] = None
    disponivel: bool = True

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
    
    if not bcrypt.checkpw(request.senha.encode('utf-8'), admin['senha'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Email ou senha incorretos")
    
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
    total_agendas = await db.agendas_fixas.count_documents({})
    total_treinos = await db.treinos.count_documents({})
    agendas_disponiveis = await db.agendas_fixas.count_documents({"disponivel": True})
    
    return {
        "total_alunos": total_alunos,
        "total_instrutores": total_instrutores,
        "total_agendas": total_agendas,
        "total_treinos": total_treinos,
        "agendas_disponiveis": agendas_disponiveis
    }

@api_router.get("/dashboard/instrutores-horarios", response_model=List[InstrutorComHorario])
async def get_instrutores_com_horarios(admin_id: str = Depends(verify_token)):
    instrutores = await db.instrutores.find({}).to_list(1000)
    result = []
    
    for instrutor in instrutores:
        agenda = await db.agendas_fixas.find_one({"instrutor_id_instrutor": str(instrutor['_id'])})
        
        dias_semana = None
        horario = None
        disponivel = True
        
        if agenda:
            dias_semana = agenda.get('dias_semana')
            horario = f"{agenda.get('hora_inicio')} - {agenda.get('hora_fim')}"
            disponivel = agenda.get('disponivel', True)
        
        result.append({
            "id_instrutor": str(instrutor['_id']),
            "nome": instrutor['nome'],
            "idade": instrutor['idade'],
            "email": instrutor.get('email'),
            "telefone": instrutor.get('telefone'),
            "dias_semana": dias_semana,
            "horario": horario,
            "disponivel": disponivel
        })
    
    return result

@api_router.patch("/instrutores/{id_instrutor}/toggle-disponibilidade")
async def toggle_instrutor_disponibilidade(id_instrutor: str, admin_id: str = Depends(verify_token)):
    agenda = await db.agendas_fixas.find_one({"instrutor_id_instrutor": id_instrutor})
    
    if agenda:
        novo_status = not agenda.get('disponivel', True)
        await db.agendas_fixas.update_one(
            {"instrutor_id_instrutor": id_instrutor},
            {"$set": {"disponivel": novo_status}}
        )
        return {"message": "Disponibilidade atualizada", "disponivel": novo_status}
    else:
        raise HTTPException(status_code=404, detail="Instrutor não possui horário fixo cadastrado")

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
    
    await db.agendas_fixas.delete_many({"instrutor_id_instrutor": id_instrutor})
    
    return {"message": "Instrutor deletado com sucesso"}

# ===================== AGENDAS FIXAS CRUD =====================

@api_router.get("/agendas-fixas", response_model=List[AgendaFixa])
async def get_agendas_fixas(admin_id: str = Depends(verify_token)):
    agendas = await db.agendas_fixas.find({}).to_list(1000)
    result = []
    
    for agenda in agendas:
        instrutor = await db.instrutores.find_one({"_id": ObjectId(agenda['instrutor_id_instrutor'])})
        result.append({
            **agenda,
            "id_agenda": str(agenda['_id']),
            "instrutor_nome": instrutor['nome'] if instrutor else "Instrutor não encontrado"
        })
    
    return result

@api_router.post("/agendas-fixas", response_model=AgendaFixa)
async def create_agenda_fixa(agenda: AgendaFixaCreate, admin_id: str = Depends(verify_token)):
    instrutor = await db.instrutores.find_one({"_id": ObjectId(agenda.instrutor_id_instrutor)})
    if not instrutor:
        raise HTTPException(status_code=404, detail="Instrutor não encontrado")
    
    if agenda.hora_fim <= agenda.hora_inicio:
        raise HTTPException(status_code=400, detail="Hora de fim deve ser maior que hora de início")
    
    # Check if instrutor already has agenda
    existing = await db.agendas_fixas.find_one({"instrutor_id_instrutor": agenda.instrutor_id_instrutor})
    if existing:
        raise HTTPException(status_code=400, detail="Instrutor já possui horário fixo cadastrado")
    
    result = await db.agendas_fixas.insert_one(agenda.model_dump())
    created = await db.agendas_fixas.find_one({"_id": result.inserted_id})
    
    return {
        **created,
        "id_agenda": str(created['_id']),
        "instrutor_nome": instrutor['nome']
    }

@api_router.put("/agendas-fixas/{id_agenda}", response_model=AgendaFixa)
async def update_agenda_fixa(id_agenda: str, agenda: AgendaFixaUpdate, admin_id: str = Depends(verify_token)):
    update_data = {k: v for k, v in agenda.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    if 'instrutor_id_instrutor' in update_data:
        instrutor = await db.instrutores.find_one({"_id": ObjectId(update_data['instrutor_id_instrutor'])})
        if not instrutor:
            raise HTTPException(status_code=404, detail="Instrutor não encontrado")
    
    result = await db.agendas_fixas.update_one(
        {"_id": ObjectId(id_agenda)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Agenda não encontrada")
    
    updated = await db.agendas_fixas.find_one({"_id": ObjectId(id_agenda)})
    instrutor = await db.instrutores.find_one({"_id": ObjectId(updated['instrutor_id_instrutor'])})
    
    return {
        **updated,
        "id_agenda": str(updated['_id']),
        "instrutor_nome": instrutor['nome'] if instrutor else "Instrutor não encontrado"
    }

@api_router.delete("/agendas-fixas/{id_agenda}")
async def delete_agenda_fixa(id_agenda: str, admin_id: str = Depends(verify_token)):
    result = await db.agendas_fixas.delete_one({"_id": ObjectId(id_agenda)})
    
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
        treino_dict = {**treino, "id_treino": str(treino['_id']), "aluno_nome": aluno['nome'] if aluno else "Aluno não encontrado"}
        
        if treino.get('instrutor_id_instrutor'):
            instrutor = await db.instrutores.find_one({"_id": ObjectId(treino['instrutor_id_instrutor'])})
            treino_dict['instrutor_nome'] = instrutor['nome'] if instrutor else "Instrutor não encontrado"
        
        result.append(treino_dict)
    
    return result

@api_router.get("/instrutores-disponiveis")
async def get_instrutores_disponiveis(data: str, hora_inicio: str, hora_fim: str, admin_id: str = Depends(verify_token)):
    # Get all available instructors
    agendas_disponiveis = await db.agendas_fixas.find({"disponivel": True}).to_list(1000)
    
    instrutores_disponiveis = []
    
    for agenda in agendas_disponiveis:
        instrutor_id = agenda['instrutor_id_instrutor']
        
        # Check if instructor is available at this time
        if agenda['hora_inicio'] <= hora_inicio and agenda['hora_fim'] >= hora_fim:
            # Check for conflicts with existing trainings
            conflito = await db.treinos.find_one({
                "instrutor_id_instrutor": instrutor_id,
                "data": data,
                "$or": [
                    {"hora_inicio": {"$lte": hora_inicio}, "hora_fim": {"$gt": hora_inicio}},
                    {"hora_inicio": {"$lt": hora_fim}, "hora_fim": {"$gte": hora_fim}},
                    {"hora_inicio": {"$gte": hora_inicio}, "hora_fim": {"$lte": hora_fim}}
                ]
            })
            
            if not conflito:
                instrutor = await db.instrutores.find_one({"_id": ObjectId(instrutor_id)})
                if instrutor:
                    instrutores_disponiveis.append({
                        "id_instrutor": str(instrutor['_id']),
                        "nome": instrutor['nome'],
                        "idade": instrutor['idade']
                    })
    
    return instrutores_disponiveis

@api_router.post("/treinos", response_model=Treino)
async def create_treino(treino: TreinoCreate, admin_id: str = Depends(verify_token)):
    aluno = await db.alunos.find_one({"_id": ObjectId(treino.aluno_id_aluno)})
    if not aluno:
        raise HTTPException(status_code=404, detail="Aluno não encontrado")
    
    treino_dict = treino.model_dump()
    treino_dict['concluido'] = False
    
    # Validate personalizado
    if treino.tipo_treino == "Personalizado":
        if not all([treino.data, treino.hora_inicio, treino.hora_fim, treino.instrutor_id_instrutor]):
            raise HTTPException(status_code=400, detail="Treino personalizado requer data, horário e instrutor")
        
        # Verify instructor
        instrutor = await db.instrutores.find_one({"_id": ObjectId(treino.instrutor_id_instrutor)})
        if not instrutor:
            raise HTTPException(status_code=404, detail="Instrutor não encontrado")
        
        # Check availability
        conflito = await db.treinos.find_one({
            "instrutor_id_instrutor": treino.instrutor_id_instrutor,
            "data": treino.data,
            "$or": [
                {"hora_inicio": {"$lte": treino.hora_inicio}, "hora_fim": {"$gt": treino.hora_inicio}},
                {"hora_inicio": {"$lt": treino.hora_fim}, "hora_fim": {"$gte": treino.hora_fim}},
                {"hora_inicio": {"$gte": treino.hora_inicio}, "hora_fim": {"$lte": treino.hora_fim}}
            ]
        })
        
        if conflito:
            raise HTTPException(status_code=400, detail="Instrutor já possui treino agendado neste horário")
    
    result = await db.treinos.insert_one(treino_dict)
    created = await db.treinos.find_one({"_id": result.inserted_id})
    
    response_dict = {**created, "id_treino": str(created['_id']), "aluno_nome": aluno['nome']}
    
    if created.get('instrutor_id_instrutor'):
        instrutor = await db.instrutores.find_one({"_id": ObjectId(created['instrutor_id_instrutor'])})
        response_dict['instrutor_nome'] = instrutor['nome'] if instrutor else None
    
    return response_dict

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
    
    response_dict = {**updated, "id_treino": str(updated['_id']), "aluno_nome": aluno['nome'] if aluno else None}
    
    if updated.get('instrutor_id_instrutor'):
        instrutor = await db.instrutores.find_one({"_id": ObjectId(updated['instrutor_id_instrutor'])})
        response_dict['instrutor_nome'] = instrutor['nome'] if instrutor else None
    
    return response_dict

@api_router.delete("/treinos/{id_treino}")
async def delete_treino(id_treino: str, admin_id: str = Depends(verify_token)):
    result = await db.treinos.delete_one({"_id": ObjectId(id_treino)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    
    return {"message": "Treino deletado com sucesso"}

@api_router.patch("/treinos/{id_treino}/toggle-concluido")
async def toggle_treino_concluido(id_treino: str, admin_id: str = Depends(verify_token)):
    treino = await db.treinos.find_one({"_id": ObjectId(id_treino)})
    if not treino:
        raise HTTPException(status_code=404, detail="Treino não encontrado")
    
    novo_status = not treino.get('concluido', False)
    
    await db.treinos.update_one(
        {"_id": ObjectId(id_treino)},
        {"$set": {"concluido": novo_status}}
    )
    
    return {"message": "Status atualizado", "concluido": novo_status}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db():
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