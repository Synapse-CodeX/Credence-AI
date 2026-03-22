# 🚀 Deploying Factify on AWS EC2

Step-by-step guide to deploy the full Factify stack (FastAPI + React) on an AWS EC2 instance using Docker.

---

## Prerequisites

| Requirement     | Recommended                   |
| --------------- | ----------------------------- |
| EC2 Instance    | `t3.small` (2 vCPU, 2 GB RAM) or larger |
| OS              | Ubuntu 22.04 LTS              |
| Storage         | 20 GB+ gp3 EBS                |
| Security Groups | Inbound: 22 (SSH), 80 (HTTP), 443 (HTTPS) |

---

## 1. Launch & Connect to EC2

1. Go to **AWS Console → EC2 → Launch Instance**.
2. Choose **Ubuntu 22.04 LTS** AMI.
3. Select instance type `t3.small` (or `t3.medium` for heavier AI workloads).
4. Configure a **Security Group** with:
   - SSH (port 22) — your IP only
   - HTTP (port 80) — `0.0.0.0/0`
   - HTTPS (port 443) — `0.0.0.0/0`
5. Create or select a key pair and download the `.pem` file.
6. Connect:
   ```bash
   chmod 400 your-key.pem
   ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
   ```

---

## 2. Install Docker & Docker Compose

```bash
# Update packages
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Allow running docker without sudo
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

---

## 3. Clone the Repository

```bash
cd ~
git clone https://github.com/<your-username>/gfg-finale.git factify
cd factify
```

---

## 4. Configure Environment Variables

### Backend `.env`

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Fill in **all** required values:

```env
SIGHTENGINE_API_USER=your_user
SIGHTENGINE_API_SECRET=your_secret
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=sk-...
LLM_MODEL_FAST=gpt-4o-mini
LLM_MODEL_REASONING=gpt-4o-mini
TAVILY_API_KEY=tvly-...
OPENAI_API_KEY=sk-...
INSFORGE_URL=your_insforge_url
INSFORGE_API_KEY=your_insforge_key
CORS_ORIGINS=http://localhost,http://your-domain.com
DEBUG=false
```

### Frontend build args (optional)

The `REACT_APP_GEMINI_API_KEY` can be passed as a build arg. Create a `.env` in the project root:

```bash
echo "REACT_APP_GEMINI_API_KEY=your_key_here" > .env
```

> [!IMPORTANT]
> Never commit `.env` files to version control. They are already in `.gitignore`.

---

## 5. Build & Start

```bash
docker compose up -d --build
```

This will:
1. Build the **backend** Docker image (FastAPI + Python dependencies)
2. Build the **frontend** Docker image (React static build + Nginx)
3. Start the **Nginx reverse proxy** routing traffic to both services

Check status:
```bash
docker compose ps
docker compose logs -f
```

### Verify

```bash
# Health check
curl http://localhost/api/health

# Frontend
curl -s http://localhost | head -5
```

---

## 6. Access the Application

Open your browser and navigate to:

```
http://<EC2_PUBLIC_IP>
```

The Nginx reverse proxy handles routing:
- `/` → React frontend
- `/api/*` → FastAPI backend
- `/socket.io/*` → WebSocket connections

---

## 7. (Optional) Custom Domain + SSL with Let's Encrypt

### Point your domain

Add an **A record** pointing your domain to the EC2 public IP.

### Install Certbot

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

### Update Nginx config

Edit `nginx/nginx.conf` — replace `server_name _;` with your domain:

```nginx
server_name yourdomain.com www.yourdomain.com;
```

Restart Nginx and obtain certificate:

```bash
docker compose down
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
docker compose up -d
```

> [!NOTE]
> For production SSL, consider mounting the cert files into the Nginx container or using a dedicated Certbot container. A simple approach is to run Nginx directly on the host for SSL termination.

---

## 8. Common Commands

| Command | Description |
| --- | --- |
| `docker compose up -d --build` | Build and start all services |
| `docker compose down` | Stop all services |
| `docker compose logs -f` | Follow all logs |
| `docker compose logs backend` | View backend logs only |
| `docker compose restart backend` | Restart backend only |
| `docker compose ps` | Check container status |
| `docker compose exec backend bash` | Shell into backend container |

---

## 9. Updating the Application

```bash
cd ~/factify

# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up -d --build
```

---

## 10. Troubleshooting

| Issue | Solution |
| --- | --- |
| **Port 80 in use** | `sudo lsof -i :80` — stop any existing process |
| **Backend health check failing** | Check env vars: `docker compose logs backend` |
| **Frontend shows blank page** | Verify `REACT_APP_BACKEND_URL` is empty (not localhost) |
| **WebSocket errors** | Ensure security group allows persistent connections |
| **Out of memory** | Upgrade to `t3.medium` or add swap: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile` |
| **Permission denied on Docker** | Run `sudo usermod -aG docker $USER` and re-login |

---

## Architecture Overview

```
┌──────────────────────────────────────────┐
│              EC2 Instance                │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │         Nginx (port 80/443)        │  │
│  │       Reverse Proxy + SSL          │  │
│  └───────┬──────────────┬─────────────┘  │
│          │              │                │
│    /api/* │         /*   │                │
│  /socket.io/*           │                │
│          │              │                │
│  ┌───────▼────────┐ ┌──▼──────────────┐ │
│  │    Backend      │ │    Frontend     │ │
│  │  FastAPI:8000   │ │   Nginx:80      │ │
│  │  (uvicorn)      │ │  (React build)  │ │
│  └────────────────┘ └─────────────────┘  │
└──────────────────────────────────────────┘
```
