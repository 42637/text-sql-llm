"""
FastAPI application for TextSQL-GPT.
Endpoints for health checks, SQL generation, SQL validation, sample schemas, and safe sandbox execution.
Production-ready with CORS origins configuration for Vercel and Render deployments.
"""
import os
import sys
import logging
from contextlib import asynccontextmanager
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel, Field

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from model_loader import ModelManager
from inference import InferenceEngine
from sql_validator import SQLValidator

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("textsql_gpt.app")

# Global instances
manager = ModelManager.get_instance()
inference_engine: Optional[InferenceEngine] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Loads the model and tokenizer strictly once at application startup.
    """
    global inference_engine
    logger.info("Initializing TextSQL-GPT-v1 backend service...")
    success = manager.load()
    if success:
        inference_engine = InferenceEngine(manager)
        logger.info(f"TextSQL-GPT-v1 loaded successfully with {manager.parameter_count:,} parameters.")
        logger.info("TextSQL-GPT-v1 backend is ready for inference.")
    else:
        logger.error(f"TextSQL-GPT-v1 failed to load: {manager.load_error}")
    yield
    logger.info("Shutting down TextSQL-GPT backend service.")


app = FastAPI(
    title="TextSQL-GPT API",
    description="Natural language to SQL generation powered by TextSQL-GPT-v1",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration: allows Vercel deployments, local dev, or custom domains
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
if allowed_origins_env == "*":
    origins = ["*"]
else:
    origins = [orig.strip() for orig in allowed_origins_env.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# Pydantic Schemas
# ==========================================

class GenerateSQLRequest(BaseModel):
    question: str = Field(..., max_length=2000, description="Natural language question to convert to SQL")
    schema_sql: str = Field("", max_length=15000, alias="schema", description="Database CREATE TABLE DDL schema")
    max_new_tokens: int = Field(256, ge=1, le=1024, description="Max tokens to generate")
    temperature: float = Field(0.0, ge=0.0, le=1.0, description="Sampling temperature (0.0 for greedy)")

    model_config = {
        "populate_by_name": True,
    }


class GenerateSQLResponse(BaseModel):
    generated_sql: str
    formatted_sql: str
    sql_valid: bool
    validation_error: Optional[str] = None
    statement_type: Optional[str] = None
    generation_time: float
    prompt_tokens: int
    generated_tokens: int
    status: str
    error: Optional[str] = None


class ValidateSQLRequest(BaseModel):
    sql: str = Field(..., max_length=10000, description="SQL query to validate")
    dialect: str = Field("sqlite", description="SQL dialect (sqlite, postgres, mysql, etc.)")


class ValidateSQLResponse(BaseModel):
    is_valid: bool
    formatted_sql: str
    error: Optional[str] = None
    statement_type: Optional[str] = None
    tables: List[str] = []


class ExecuteSQLRequest(BaseModel):
    schema_sql: str = Field("", max_length=20000, alias="schema", description="Schema DDL and optional test data")
    sql: str = Field(..., max_length=5000, description="SELECT query to safely execute")
    max_rows: int = Field(50, ge=1, le=100, description="Maximum rows to return")

    model_config = {
        "populate_by_name": True,
    }


class ExecuteSQLResponse(BaseModel):
    success: bool
    error: Optional[str] = None
    columns: List[str] = []
    rows: List[List[Any]] = []
    row_count: int = 0
    is_truncated: bool = False


# ==========================================
# Core Endpoints (Supports both root and /api/ paths)
# ==========================================

@app.get("/health")
@app.get("/api/health")
async def health_check():
    """
    Returns the backend status, model loading state, device, and metadata.
    Exposed at both /health and /api/health for Render and frontend flexibility.
    """
    status_info = manager.get_status()
    return status_info


@app.post("/generate", response_model=GenerateSQLResponse)
@app.post("/api/generate", response_model=GenerateSQLResponse)
@app.post("/api/generate-sql", response_model=GenerateSQLResponse)
async def generate_sql(payload: GenerateSQLRequest):
    """
    Converts a natural language question and database schema into a SQL query
    using the original TextSQL-GPT-v1 model.
    Exposed at /generate, /api/generate, and /api/generate-sql.
    """
    if not manager.is_loaded or inference_engine is None:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "generated_sql": "",
                "formatted_sql": "",
                "sql_valid": False,
                "validation_error": None,
                "statement_type": None,
                "generation_time": 0.0,
                "prompt_tokens": 0,
                "generated_tokens": 0,
                "status": "error",
                "error": f"Model not ready: {manager.load_error or 'Backend initializing'}",
            },
        )

    logger.info(f"Incoming Question: '{payload.question}'")
    logger.info(f"Incoming Schema: '{payload.schema_sql[:100]}...'")

    res = inference_engine.generate_sql(
        question=payload.question,
        schema=payload.schema_sql,
        max_new_tokens=payload.max_new_tokens,
        temperature=payload.temperature,
    )

    logger.info(f"Generated SQL: '{res['generated_sql']}' (Valid: {res['sql_valid']})")

    return GenerateSQLResponse(
        generated_sql=res["generated_sql"],
        formatted_sql=res["formatted_sql"],
        sql_valid=res["sql_valid"],
        validation_error=res["validation_error"],
        statement_type=res.get("statement_type"),
        generation_time=res["generation_time_seconds"],
        prompt_tokens=res["prompt_tokens"],
        generated_tokens=res["generated_tokens"],
        status=res["status"],
        error=res["error"],
    )


@app.post("/validate-sql", response_model=ValidateSQLResponse)
@app.post("/api/validate-sql", response_model=ValidateSQLResponse)
async def validate_sql(payload: ValidateSQLRequest):
    """
    Validates SQL syntax and formats using SQLGlot.
    """
    result = SQLValidator.validate_syntax(payload.sql, dialect=payload.dialect)
    return ValidateSQLResponse(
        is_valid=result["is_valid"],
        formatted_sql=result["formatted_sql"],
        error=result["error"],
        statement_type=result.get("statement_type"),
        tables=result.get("tables", []),
    )


@app.post("/execute-sql", response_model=ExecuteSQLResponse)
@app.post("/api/execute-sql", response_model=ExecuteSQLResponse)
async def execute_sql(payload: ExecuteSQLRequest):
    """
    Safely executes a query in an isolated, in-memory SQLite sandbox.
    """
    result = SQLValidator.execute_in_sandbox(
        schema_sql=payload.schema_sql,
        query_sql=payload.sql,
        max_rows=payload.max_rows,
    )
    return ExecuteSQLResponse(
        success=result["success"],
        error=result["error"],
        columns=result["columns"],
        rows=result["rows"],
        row_count=result["row_count"],
        is_truncated=result.get("is_truncated", False),
    )


@app.get("/sample-schemas")
@app.get("/api/sample-schemas")
async def get_sample_schemas():
    """
    Returns curated database schemas and example questions formatted for maximum model accuracy.
    """
    samples = [
        {
            "id": "employees",
            "name": "HR & Employees",
            "description": "Company personnel, salaries, and departments",
            "schema": (
                "CREATE TABLE employees (\n"
                "    id INTEGER PRIMARY KEY,\n"
                "    name TEXT,\n"
                "    salary REAL,\n"
                "    department TEXT\n"
                ");"
            ),
            "sample_data": (
                "INSERT INTO employees VALUES (1, 'Alice Johnson', 125000, 'Engineering');\n"
                "INSERT INTO employees VALUES (2, 'Bob Smith', 98000, 'Engineering');\n"
                "INSERT INTO employees VALUES (3, 'Carol White', 105000, 'Marketing');\n"
                "INSERT INTO employees VALUES (4, 'David Brown', 88000, 'Sales');\n"
                "INSERT INTO employees VALUES (5, 'Emma Davis', 140000, 'Engineering');\n"
                "INSERT INTO employees VALUES (6, 'Frank Miller', 75000, 'Marketing');"
            ),
            "questions": [
                "Show the top 5 employees with the highest salaries.",
                "List all employees in the Engineering department.",
                "Find the average salary of employees.",
                "Count the number of employees.",
            ],
        },
        {
            "id": "ecommerce",
            "name": "E-Commerce Store",
            "description": "Customers and order purchases",
            "schema": (
                "CREATE TABLE customers (\n"
                "    id INTEGER PRIMARY KEY,\n"
                "    name TEXT\n"
                ");\n"
                "CREATE TABLE orders (\n"
                "    id INTEGER PRIMARY KEY,\n"
                "    customer_id INTEGER,\n"
                "    total_amount REAL\n"
                ");"
            ),
            "sample_data": (
                "INSERT INTO customers VALUES (1, 'Sophia Taylor');\n"
                "INSERT INTO customers VALUES (2, 'Liam Wilson');\n"
                "INSERT INTO customers VALUES (3, 'Mia Garcia');\n"
                "INSERT INTO orders VALUES (101, 1, 249.99);\n"
                "INSERT INTO orders VALUES (102, 1, 89.50);\n"
                "INSERT INTO orders VALUES (103, 2, 599.00);\n"
                "INSERT INTO orders VALUES (104, 3, 120.00);"
            ),
            "questions": [
                "Find the top 10 customers by total purchase amount.",
                "Show all orders with a total amount greater than 200.",
                "Count the total number of orders.",
            ],
        },
        {
            "id": "university",
            "name": "University & Courses",
            "description": "Students, courses, and enrollments",
            "schema": (
                "CREATE TABLE students (\n"
                "    id INTEGER PRIMARY KEY,\n"
                "    name TEXT,\n"
                "    gpa REAL\n"
                ");\n"
                "CREATE TABLE courses (\n"
                "    id INTEGER PRIMARY KEY,\n"
                "    title TEXT,\n"
                "    department TEXT\n"
                ");\n"
                "CREATE TABLE enrollments (\n"
                "    student_id INTEGER,\n"
                "    course_id INTEGER,\n"
                "    grade TEXT\n"
                ");"
            ),
            "sample_data": (
                "INSERT INTO students VALUES (1, 'James Anderson', 3.85);\n"
                "INSERT INTO students VALUES (2, 'Olivia Martin', 3.92);\n"
                "INSERT INTO students VALUES (3, 'Lucas Lee', 2.75);\n"
                "INSERT INTO courses VALUES (201, 'Data Structures', 'Computer Science');\n"
                "INSERT INTO courses VALUES (202, 'Linear Algebra', 'Mathematics');\n"
                "INSERT INTO enrollments VALUES (1, 201, 'A');\n"
                "INSERT INTO enrollments VALUES (2, 201, 'A');\n"
                "INSERT INTO enrollments VALUES (3, 202, 'B');"
            ),
            "questions": [
                "Find all students with a GPA higher than 3.5.",
                "How many students are enrolled in course 201?",
                "List all courses in Computer Science.",
            ],
        },
    ]
    return samples


# ==========================================
# Static Files & SPA Fallback (Frontend Serving when built locally)
# ==========================================
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
