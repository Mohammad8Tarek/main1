# Tal Avenue Staff Housing Management

This is a full-stack web application for managing staff accommodation, including room assignments, maintenance tracking, and user administration. The backend is built with Node.js/Express and Prisma, and the entire application is containerized with Docker for easy deployment.

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/)

## 🚀 Getting Started

Follow these steps to get the application up and running.

### 1. Configuration

Before starting the application, you need to create an environment file for the backend.

Create a file named `.env` inside the `backend/` directory:

```bash
touch backend/.env
```

Now, open `backend/.env` and add the following required environment variables.

```env
# This DATABASE_URL is for local development WITHOUT Docker.
# The Docker setup overrides this, but it's good practice to have it.
DATABASE_URL="postgresql://postgres:password@localhost:5432/inventory"

# JWT Secrets - IMPORTANT: Change these to long, random strings in production!
JWT_SECRET="your-super-secret-key-for-jwt"
JWT_EXPIRES_IN="1d"
JWT_REFRESH_SECRET="your-super-secret-key-for-refresh-tokens"
JWT_REFRESH_EXPIRES_IN="7d"

# Application Port
PORT=8000

# Node Environment
NODE_ENV="development"
```

**Note:** You do not need to change the `DATABASE_URL` for the Docker environment. `docker-compose.yml` automatically provides the correct URL to the backend service.

### 2. Running the Application

With Docker and Docker Compose installed, you can build and start all the services with a single command from the project's root directory:

```bash
docker-compose up -d --build
```

- `--build`: This flag forces Docker to rebuild the backend image if there have been any changes to the code or `Dockerfile`.
- `-d`: This runs the containers in detached mode (in the background).

The first time you run this, it will download the PostgreSQL image and build the backend image, which may take a few minutes.

### 3. Database Migration

The backend service is configured to automatically run database migrations upon startup (`npx prisma migrate deploy`). This ensures your database schema is always up to date with your Prisma schema definition.

### 4. Accessing the Application

- **Frontend**: Once the services are running, the frontend will be available at the URL provided by your AI Studio environment.
- **Backend API**: The API will be accessible at `http://localhost:8000`.
- **Database**: You can connect to the PostgreSQL database using a GUI tool (like DBeaver, TablePlus, or Prisma Studio) at `localhost:5432` with the credentials you set in `docker-compose.yml` (user: `postgres`, password: `password`).

To run Prisma Studio:
```bash
npx prisma studio
```

### 5. Stopping the Application

To stop the running containers, execute the following command in the project's root directory:

```bash
docker-compose down
```

This will stop and remove the containers. The database data will be preserved in a Docker volume (`postgres_data`), so you won't lose your data when you stop the services.
