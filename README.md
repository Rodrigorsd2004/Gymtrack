# 🏋️ GymTrack - Sistema de Gestão de Academia

Sistema completo de gestão de academia desenvolvido com FastAPI, React e MongoDB. Permite gerenciar alunos, instrutores, horários fixos e treinos personalizados de forma eficiente.

## 📋 Índice

- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Como Executar](#como-executar)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades](#funcionalidades)
- [Credenciais Padrão](#credenciais-padrão)
- [Fluxo de Uso](#fluxo-de-uso)

## 🚀 Tecnologias Utilizadas

### Backend
- **FastAPI** - Framework web Python de alta performance
- **MongoDB** - Banco de dados NoSQL
- **Motor** - Driver assíncrono para MongoDB
- **PyJWT** - Autenticação JWT
- **Bcrypt** - Hash de senhas
- **Pydantic** - Validação de dados

### Frontend
- **React 19** - Biblioteca JavaScript para interfaces
- **React Router DOM** - Navegação
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Framework CSS
- **Shadcn/UI** - Componentes UI
- **Sonner** - Notificações toast
- **Lucide React** - Ícones

## 📦 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **Python** (versão 3.10 ou superior)
- **MongoDB** (versão 5.0 ou superior)
- **Yarn** (gerenciador de pacotes)

### Instalação do MongoDB

#### Linux (Ubuntu/Debian)
```bash
# Importar chave pública
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -

# Adicionar repositório
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list

# Instalar MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Iniciar serviço
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### macOS
```bash
# Com Homebrew
brew tap mongodb/brew
brew install mongodb-community@5.0
brew services start mongodb-community@5.0
```

#### Windows
Baixe o instalador oficial: https://www.mongodb.com/try/download/community

## 📥 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/gymtrack.git
cd gymtrack
```

### 2. Instalar dependências do Backend

```bash
cd backend
pip install -r requirements.txt
```

### 3. Instalar dependências do Frontend

```bash
cd ../frontend
yarn install
```

## ⚙️ Configuração

### 1. Configurar Backend

Edite o arquivo `backend/.env`:

```env
# MongoDB
MONGO_URL="mongodb://localhost:27017"
DB_NAME="GymTrack_DB"

# JWT Secret (altere para produção!)
JWT_SECRET="gymtrack_secret_key_change_in_production"

# CORS
CORS_ORIGINS="http://localhost:3000"
```

### 2. Configurar Frontend

Edite o arquivo `frontend/.env`:

```env
# URL do Backend
REACT_APP_BACKEND_URL=http://localhost:8001

# Outras configurações
WDS_SOCKET_PORT=443
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
```

### 3. Verificar MongoDB

Certifique-se de que o MongoDB está rodando:

```bash
# Verificar status
sudo systemctl status mongod

# OU
mongosh --eval "db.adminCommand('ping')"
```

## 🏃 Como Executar

### Opção 1: Executar separadamente (Desenvolvimento)

#### Terminal 1 - Backend
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

O backend estará disponível em: **http://localhost:8001**

#### Terminal 2 - Frontend
```bash
cd frontend
yarn start
```

O frontend estará disponível em: **http://localhost:3000**

### Opção 2: Executar com script (Recomendado)

Crie um script `start.sh` na raiz do projeto:

```bash
#!/bin/bash

# Iniciar backend em background
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!

# Iniciar frontend
cd ../frontend
yarn start &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "✓ Backend rodando em http://localhost:8001"
echo "✓ Frontend rodando em http://localhost:3000"
echo ""
echo "Pressione Ctrl+C para parar ambos os serviços"

# Esperar por Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
```

Dê permissão de execução:
```bash
chmod +x start.sh
./start.sh
```

## 📁 Estrutura do Projeto

```
gymtrack/
├── backend/                    # Backend FastAPI
│   ├── server.py              # Aplicação principal
│   ├── .env                   # Variáveis de ambiente
│   └── requirements.txt       # Dependências Python
│
├── frontend/                  # Frontend React
│   ├── public/               # Arquivos públicos
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   │   ├── Layout.jsx   # Layout principal
│   │   │   └── ui/          # Componentes Shadcn
│   │   ├── pages/           # Páginas da aplicação
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Alunos.jsx
│   │   │   ├── Instrutores.jsx
│   │   │   ├── Agendas.jsx
│   │   │   └── Treinos.jsx
│   │   ├── App.js           # Componente principal
│   │   ├── App.css          # Estilos globais
│   │   └── index.js         # Entry point
│   ├── .env                 # Variáveis de ambiente
│   ├── package.json         # Dependências Node
│   └── tailwind.config.js   # Configuração Tailwind
│
└── README.md                 # Este arquivo
```

## ✨ Funcionalidades

### 🔐 Autenticação
- Login seguro com JWT
- Proteção de rotas
- Logout

### 👥 Gestão de Alunos
- Criar, editar e deletar alunos
- Validação de idade mínima (7 anos)
- Email único por aluno
- Busca por nome ou email

### 👨‍🏫 Gestão de Instrutores
- Criar, editar e deletar instrutores
- Validação de idade mínima (18 anos)
- Email único por instrutor
- Busca por nome ou email

### 📅 Gestão de Agendas (Horários Fixos)
- Definir horários fixos de trabalho dos instrutores
- Especificar dias da semana (ex: Seg-Sex)
- Definir hora início e fim
- Toggle de disponibilidade
- Visualizar treinos agendados

### 🏋️ Gestão de Treinos

#### Treinos Simples
- Cadastro básico sem agendamento
- Nome do treino e aluno

#### Treinos Personalizados
- Agendamento com data e horário específicos
- Sistema inteligente de disponibilidade de instrutores
- Verificação automática de conflitos de horários
- Nível de treino (Iniciante, Intermediário, Avançado)
- Descrição personalizada
- Status de conclusão

### 📊 Dashboard
- Estatísticas gerais (alunos, instrutores, treinos)
- Visualização de instrutores e seus horários fixos
- Controle de disponibilidade (ativar/desativar)
- Instruções de uso do sistema

## 🔑 Credenciais Padrão

O sistema cria automaticamente um administrador padrão na primeira execução:

```
Email: admin@gymtrack.com
Senha: admin123
```

**⚠️ IMPORTANTE:** Altere estas credenciais em produção!

## 🎯 Fluxo de Uso

### 1. Primeiro Acesso
1. Acesse `http://localhost:3000`
2. Faça login com as credenciais padrão
3. Você será redirecionado para o Dashboard

### 2. Configuração Inicial
1. Cadastre **Instrutores** na seção "Instrutores"
2. Defina **Horários Fixos** na seção "Agendas"
   - Selecione o instrutor
   - Defina dias da semana (ex: Seg-Sex, Seg/Qua/Sex)
   - Defina horário de trabalho (ex: 08:00 - 18:00)

### 3. Cadastro de Alunos
1. Vá para "Alunos"
2. Clique em "Novo Aluno"
3. Preencha os dados (idade mínima: 7 anos)

### 4. Criação de Treinos

#### Treino Simples
1. Vá para "Treinos"
2. Clique em "Novo Treino"
3. Selecione "Simples"
4. Preencha nome e selecione o aluno

#### Treino Personalizado
1. Vá para "Treinos"
2. Clique em "Novo Treino"
3. Selecione "Personalizado"
4. Preencha:
   - Nome do treino
   - Aluno
   - **Data e horário desejados**
5. O sistema mostrará automaticamente **apenas instrutores disponíveis** naquele horário
6. Selecione o instrutor e preencha detalhes (nível, descrição)

### 5. Gerenciamento no Dashboard
- Visualize todos os instrutores e seus horários
- Use o botão "Ativo/Inativo" para controlar disponibilidade temporária
- Instrutor inativo não aparecerá como opção em novos treinos

### 6. Visualização de Treinos Agendados
- Vá para "Agendas" > aba "Treinos Agendados"
- Visualize todos os treinos personalizados com data/hora
- Marque como concluído após realização

## 🔧 Resolução de Problemas

### Problema: MongoDB não está rodando
```bash
# Linux
sudo systemctl start mongod

# macOS
brew services start mongodb-community@5.0
```

### Problema: Porta 8001 ou 3000 já está em uso
```bash
# Descobrir qual processo está usando a porta
lsof -i :8001  # ou :3000

# Matar o processo
kill -9 <PID>
```

### Problema: Erro de dependências no Frontend
```bash
cd frontend
rm -rf node_modules yarn.lock
yarn install
```

### Problema: Erro de dependências no Backend
```bash
cd backend
pip install --upgrade pip
pip install -r requirements.txt
```

## 🛡️ Segurança em Produção

Para ambientes de produção, considere:

1. **Alterar JWT_SECRET** no `.env` para uma chave forte
2. **Alterar credenciais de admin padrão** após primeira instalação
3. **Configurar CORS** corretamente para permitir apenas domínios confiáveis
4. **Usar HTTPS** para comunicação segura
5. **Configurar MongoDB** com autenticação:
   ```
   MONGO_URL="mongodb://usuario:senha@localhost:27017/GymTrack_DB?authSource=admin"
   ```
6. **Usar variáveis de ambiente** para informações sensíveis
7. **Implementar rate limiting** para prevenir ataques

## 📝 API Endpoints Principais

### Autenticação
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Dados do admin logado

### Alunos
- `GET /api/alunos` - Listar todos
- `POST /api/alunos` - Criar
- `PUT /api/alunos/{id}` - Atualizar
- `DELETE /api/alunos/{id}` - Deletar

### Instrutores
- `GET /api/instrutores` - Listar todos
- `POST /api/instrutores` - Criar
- `PUT /api/instrutores/{id}` - Atualizar
- `DELETE /api/instrutores/{id}` - Deletar

### Agendas (Horários Fixos)
- `GET /api/agendas-fixas` - Listar todos
- `POST /api/agendas-fixas` - Criar
- `PUT /api/agendas-fixas/{id}` - Atualizar
- `DELETE /api/agendas-fixas/{id}` - Deletar

### Treinos
- `GET /api/treinos` - Listar todos
- `POST /api/treinos` - Criar
- `PUT /api/treinos/{id}` - Atualizar
- `DELETE /api/treinos/{id}` - Deletar
- `GET /api/instrutores-disponiveis` - Buscar instrutores disponíveis
- `PATCH /api/treinos/{id}/toggle-concluido` - Marcar como concluído

### Dashboard
- `GET /api/dashboard/stats` - Estatísticas gerais
- `GET /api/dashboard/instrutores-horarios` - Instrutores com horários
- `PATCH /api/instrutores/{id}/toggle-disponibilidade` - Toggle disponibilidade

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

Sistema desenvolvido para gestão eficiente de academias.

---

**🎉 Aproveite o GymTrack e boa gestão!**

