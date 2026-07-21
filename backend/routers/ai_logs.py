import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.ai_logs import Ai_logsService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/ai_logs", tags=["ai_logs"])


# ---------- Pydantic Schemas ----------
class Ai_logsData(BaseModel):
    """Entity data schema (for create/update)"""
    tenant_id: int
    request_id: str
    model: str
    prompt: str
    response: str = None
    tokens_used: int = None
    latency_ms: int = None
    status: str = None


class Ai_logsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    tenant_id: Optional[int] = None
    request_id: Optional[str] = None
    model: Optional[str] = None
    prompt: Optional[str] = None
    response: Optional[str] = None
    tokens_used: Optional[int] = None
    latency_ms: Optional[int] = None
    status: Optional[str] = None


class Ai_logsResponse(BaseModel):
    """Entity response schema"""
    id: int
    tenant_id: int
    request_id: str
    model: str
    prompt: str
    response: Optional[str] = None
    tokens_used: Optional[int] = None
    latency_ms: Optional[int] = None
    status: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Ai_logsListResponse(BaseModel):
    """List response schema"""
    items: List[Ai_logsResponse]
    total: int
    skip: int
    limit: int


class Ai_logsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Ai_logsData]


class Ai_logsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Ai_logsUpdateData


class Ai_logsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Ai_logsBatchUpdateItem]


class Ai_logsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Ai_logsListResponse)
async def query_ai_logss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query ai_logss with filtering, sorting, and pagination"""
    logger.debug(f"Querying ai_logss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Ai_logsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")
        
        result = await service.get_list(
            skip=skip, 
            limit=limit,
            query_dict=query_dict,
            sort=sort,
        )
        logger.debug(f"Found {result['total']} ai_logss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid ai_logs query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying ai_logss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Ai_logsListResponse)
async def query_ai_logss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query ai_logss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying ai_logss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Ai_logsService(db)
    try:
        # Parse query JSON if provided
        query_dict = None
        if query:
            try:
                query_dict = json.loads(query)
            except json.JSONDecodeError:
                raise HTTPException(status_code=400, detail="Invalid query JSON format")

        result = await service.get_list(
            skip=skip,
            limit=limit,
            query_dict=query_dict,
            sort=sort
        )
        logger.debug(f"Found {result['total']} ai_logss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid ai_logs query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying ai_logss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Ai_logsResponse)
async def get_ai_logs(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single ai_logs by ID"""
    logger.debug(f"Fetching ai_logs with id: {id}, fields={fields}")
    
    service = Ai_logsService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Ai_logs with id {id} not found")
            raise HTTPException(status_code=404, detail="Ai_logs not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching ai_logs {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Ai_logsResponse, status_code=201)
async def create_ai_logs(
    data: Ai_logsData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new ai_logs"""
    logger.debug(f"Creating new ai_logs with data: {data}")
    
    service = Ai_logsService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create ai_logs")
        
        logger.info(f"Ai_logs created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating ai_logs: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating ai_logs: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Ai_logsResponse], status_code=201)
async def create_ai_logss_batch(
    request: Ai_logsBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple ai_logss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} ai_logss")
    
    service = Ai_logsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} ai_logss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Ai_logsResponse])
async def update_ai_logss_batch(
    request: Ai_logsBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple ai_logss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} ai_logss")
    
    service = Ai_logsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} ai_logss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Ai_logsResponse)
async def update_ai_logs(
    id: int,
    data: Ai_logsUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing ai_logs"""
    logger.debug(f"Updating ai_logs {id} with data: {data}")

    service = Ai_logsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Ai_logs with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Ai_logs not found")
        
        logger.info(f"Ai_logs {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating ai_logs {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating ai_logs {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_ai_logss_batch(
    request: Ai_logsBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple ai_logss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} ai_logss")
    
    service = Ai_logsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} ai_logss successfully")
        return {"message": f"Successfully deleted {deleted_count} ai_logss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_ai_logs(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single ai_logs by ID"""
    logger.debug(f"Deleting ai_logs with id: {id}")
    
    service = Ai_logsService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Ai_logs with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Ai_logs not found")
        
        logger.info(f"Ai_logs {id} deleted successfully")
        return {"message": "Ai_logs deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting ai_logs {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")