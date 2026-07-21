import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.tenant_settings import Tenant_settingsService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/tenant_settings", tags=["tenant_settings"])


# ---------- Pydantic Schemas ----------
class Tenant_settingsData(BaseModel):
    """Entity data schema (for create/update)"""
    tenant_id: int
    setting_key: str
    setting_value: str
    category: str = None


class Tenant_settingsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    tenant_id: Optional[int] = None
    setting_key: Optional[str] = None
    setting_value: Optional[str] = None
    category: Optional[str] = None


class Tenant_settingsResponse(BaseModel):
    """Entity response schema"""
    id: int
    tenant_id: int
    setting_key: str
    setting_value: str
    category: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Tenant_settingsListResponse(BaseModel):
    """List response schema"""
    items: List[Tenant_settingsResponse]
    total: int
    skip: int
    limit: int


class Tenant_settingsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Tenant_settingsData]


class Tenant_settingsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Tenant_settingsUpdateData


class Tenant_settingsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Tenant_settingsBatchUpdateItem]


class Tenant_settingsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Tenant_settingsListResponse)
async def query_tenant_settingss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query tenant_settingss with filtering, sorting, and pagination"""
    logger.debug(f"Querying tenant_settingss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Tenant_settingsService(db)
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
        logger.debug(f"Found {result['total']} tenant_settingss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid tenant_settings query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying tenant_settingss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Tenant_settingsListResponse)
async def query_tenant_settingss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query tenant_settingss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying tenant_settingss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Tenant_settingsService(db)
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
        logger.debug(f"Found {result['total']} tenant_settingss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid tenant_settings query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying tenant_settingss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Tenant_settingsResponse)
async def get_tenant_settings(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single tenant_settings by ID"""
    logger.debug(f"Fetching tenant_settings with id: {id}, fields={fields}")
    
    service = Tenant_settingsService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Tenant_settings with id {id} not found")
            raise HTTPException(status_code=404, detail="Tenant_settings not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching tenant_settings {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Tenant_settingsResponse, status_code=201)
async def create_tenant_settings(
    data: Tenant_settingsData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new tenant_settings"""
    logger.debug(f"Creating new tenant_settings with data: {data}")
    
    service = Tenant_settingsService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create tenant_settings")
        
        logger.info(f"Tenant_settings created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating tenant_settings: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating tenant_settings: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Tenant_settingsResponse], status_code=201)
async def create_tenant_settingss_batch(
    request: Tenant_settingsBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple tenant_settingss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} tenant_settingss")
    
    service = Tenant_settingsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} tenant_settingss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Tenant_settingsResponse])
async def update_tenant_settingss_batch(
    request: Tenant_settingsBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple tenant_settingss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} tenant_settingss")
    
    service = Tenant_settingsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} tenant_settingss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Tenant_settingsResponse)
async def update_tenant_settings(
    id: int,
    data: Tenant_settingsUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing tenant_settings"""
    logger.debug(f"Updating tenant_settings {id} with data: {data}")

    service = Tenant_settingsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Tenant_settings with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Tenant_settings not found")
        
        logger.info(f"Tenant_settings {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating tenant_settings {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating tenant_settings {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_tenant_settingss_batch(
    request: Tenant_settingsBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple tenant_settingss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} tenant_settingss")
    
    service = Tenant_settingsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} tenant_settingss successfully")
        return {"message": f"Successfully deleted {deleted_count} tenant_settingss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_tenant_settings(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single tenant_settings by ID"""
    logger.debug(f"Deleting tenant_settings with id: {id}")
    
    service = Tenant_settingsService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Tenant_settings with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Tenant_settings not found")
        
        logger.info(f"Tenant_settings {id} deleted successfully")
        return {"message": "Tenant_settings deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting tenant_settings {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")