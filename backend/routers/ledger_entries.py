import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.ledger_entries import Ledger_entriesService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/ledger_entries", tags=["ledger_entries"])


# ---------- Pydantic Schemas ----------
class Ledger_entriesData(BaseModel):
    """Entity data schema (for create/update)"""
    tenant_id: int
    account_id: int
    description: str
    amount: float
    entry_type: str
    reference_id: str = None
    status: str = None


class Ledger_entriesUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    tenant_id: Optional[int] = None
    account_id: Optional[int] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    entry_type: Optional[str] = None
    reference_id: Optional[str] = None
    status: Optional[str] = None


class Ledger_entriesResponse(BaseModel):
    """Entity response schema"""
    id: int
    tenant_id: int
    account_id: int
    description: str
    amount: float
    entry_type: str
    reference_id: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Ledger_entriesListResponse(BaseModel):
    """List response schema"""
    items: List[Ledger_entriesResponse]
    total: int
    skip: int
    limit: int


class Ledger_entriesBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Ledger_entriesData]


class Ledger_entriesBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Ledger_entriesUpdateData


class Ledger_entriesBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Ledger_entriesBatchUpdateItem]


class Ledger_entriesBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Ledger_entriesListResponse)
async def query_ledger_entriess(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query ledger_entriess with filtering, sorting, and pagination"""
    logger.debug(f"Querying ledger_entriess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Ledger_entriesService(db)
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
        logger.debug(f"Found {result['total']} ledger_entriess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid ledger_entries query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying ledger_entriess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Ledger_entriesListResponse)
async def query_ledger_entriess_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query ledger_entriess with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying ledger_entriess: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Ledger_entriesService(db)
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
        logger.debug(f"Found {result['total']} ledger_entriess")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid ledger_entries query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying ledger_entriess: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Ledger_entriesResponse)
async def get_ledger_entries(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single ledger_entries by ID"""
    logger.debug(f"Fetching ledger_entries with id: {id}, fields={fields}")
    
    service = Ledger_entriesService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Ledger_entries with id {id} not found")
            raise HTTPException(status_code=404, detail="Ledger_entries not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching ledger_entries {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Ledger_entriesResponse, status_code=201)
async def create_ledger_entries(
    data: Ledger_entriesData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new ledger_entries"""
    logger.debug(f"Creating new ledger_entries with data: {data}")
    
    service = Ledger_entriesService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create ledger_entries")
        
        logger.info(f"Ledger_entries created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating ledger_entries: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating ledger_entries: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Ledger_entriesResponse], status_code=201)
async def create_ledger_entriess_batch(
    request: Ledger_entriesBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple ledger_entriess in a single request"""
    logger.debug(f"Batch creating {len(request.items)} ledger_entriess")
    
    service = Ledger_entriesService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} ledger_entriess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Ledger_entriesResponse])
async def update_ledger_entriess_batch(
    request: Ledger_entriesBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple ledger_entriess in a single request"""
    logger.debug(f"Batch updating {len(request.items)} ledger_entriess")
    
    service = Ledger_entriesService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} ledger_entriess successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Ledger_entriesResponse)
async def update_ledger_entries(
    id: int,
    data: Ledger_entriesUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing ledger_entries"""
    logger.debug(f"Updating ledger_entries {id} with data: {data}")

    service = Ledger_entriesService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Ledger_entries with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Ledger_entries not found")
        
        logger.info(f"Ledger_entries {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating ledger_entries {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating ledger_entries {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_ledger_entriess_batch(
    request: Ledger_entriesBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple ledger_entriess by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} ledger_entriess")
    
    service = Ledger_entriesService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} ledger_entriess successfully")
        return {"message": f"Successfully deleted {deleted_count} ledger_entriess", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_ledger_entries(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single ledger_entries by ID"""
    logger.debug(f"Deleting ledger_entries with id: {id}")
    
    service = Ledger_entriesService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Ledger_entries with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Ledger_entries not found")
        
        logger.info(f"Ledger_entries {id} deleted successfully")
        return {"message": "Ledger_entries deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting ledger_entries {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")