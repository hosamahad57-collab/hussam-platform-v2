import logging
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from services.compiler_service import simulate_compilation, get_compiler_stages

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/compiler", tags=["compiler"])


class CompileRequest(BaseModel):
    code: str
    stages: Optional[List[str]] = None


class StageLog(BaseModel):
    timestamp: str
    level: str
    message: str


class StageResult(BaseModel):
    name: str
    status: str
    duration_ms: int
    logs: List[dict]


class CompileResponse(BaseModel):
    stages_completed: List[dict]
    total_duration_ms: int
    final_status: str
    compiled_output: str


class StageInfo(BaseModel):
    name: str
    description: str
    order: int


@router.post("/simulate", response_model=CompileResponse)
async def compile_simulate(data: CompileRequest):
    """Simulate the HUS compiler pipeline."""
    result = simulate_compilation(data.code, data.stages)
    return CompileResponse(**result)


@router.get("/stages", response_model=List[StageInfo])
async def list_stages():
    """Get available compiler stages."""
    stages = get_compiler_stages()
    return [StageInfo(**s) for s in stages]