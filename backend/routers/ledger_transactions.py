import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.ledger_transactions import Ledger_transactionsService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/ledger_transactions", tags=["ledger_transactions"])


# ---------- Pydantic Schemas ----------
class Ledger_transactionsData(BaseModel):
    """Entity data schema (for create/update)"""
    tenant_id: int
    ledger_entry_id: int
    debit_account: str
    credit_account: str
    amount: float
    status: str = None
    memo: str = None


class Ledger_transactionsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    tenant_id: Optional[int] = None
    ledger_entry_id: Optional[int] = None
    debit_account: Optional[str] = None
    credit_account: Optional[str] = None
    amount: Optional[float] = None
    status: Optional[str] = None
    memo: Optional[str] = None


class Ledger_transactionsResponse(BaseModel):
    """Entity response schema"""
    id: int
    tenant_id: int
    ledger_entry_id: int
    debit_account: str
    credit_account: str
    amount: float
    status: Optional[str] = None
    memo: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Ledger_transactionsListResponse(BaseModel):
    """List response schema"""
    items: List[Ledger_transactionsResponse]
    total: int
    skip: int
    limit: int


class Ledger_transactionsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Ledger_transactionsData]


class Ledger_transactionsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Ledger_transactionsUpdateData


class Ledger_transactionsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Ledger_transactionsBatchUpdateItem]


class Ledger_transactionsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Ledger_transactionsListResponse)
async def query_ledger_transactionss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query ledger_transactionss with filtering, sorting, and pagination"""
    logger.debug(f"Querying ledger_transactionss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Ledger_transactionsService(db)
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
        logger.debug(f"Found {result['total']} ledger_transactionss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid ledger_transactions query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying ledger_transactionss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Ledger_transactionsListResponse)
async def query_ledger_transactionss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query ledger_transactionss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying ledger_transactionss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Ledger_transactionsService(db)
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
        logger.debug(f"Found {result['total']} ledger_transactionss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid ledger_transactions query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying ledger_transactionss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Ledger_transactionsResponse)
async def get_ledger_transactions(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single ledger_transactions by ID"""
    logger.debug(f"Fetching ledger_transactions with id: {id}, fields={fields}")
    
    service = Ledger_transactionsService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Ledger_transactions with id {id} not found")
            raise HTTPException(status_code=404, detail="Ledger_transactions not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching ledger_transactions {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Ledger_transactionsResponse, status_code=201)
async def create_ledger_transactions(
    data: Ledger_transactionsData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new ledger_transactions"""
    logger.debug(f"Creating new ledger_transactions with data: {data}")
    
    service = Ledger_transactionsService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create ledger_transactions")
        
        logger.info(f"Ledger_transactions created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating ledger_transactions: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating ledger_transactions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Ledger_transactionsResponse], status_code=201)
async def create_ledger_transactionss_batch(
    request: Ledger_transactionsBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple ledger_transactionss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} ledger_transactionss")
    
    service = Ledger_transactionsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} ledger_transactionss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Ledger_transactionsResponse])
async def update_ledger_transactionss_batch(
    request: Ledger_transactionsBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple ledger_transactionss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} ledger_transactionss")
    
    service = Ledger_transactionsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} ledger_transactionss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Ledger_transactionsResponse)
async def update_ledger_transactions(
    id: int,
    data: Ledger_transactionsUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing ledger_transactions"""
    logger.debug(f"Updating ledger_transactions {id} with data: {data}")

    service = Ledger_transactionsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Ledger_transactions with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Ledger_transactions not found")
        
        logger.info(f"Ledger_transactions {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating ledger_transactions {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating ledger_transactions {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_ledger_transactionss_batch(
    request: Ledger_transactionsBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple ledger_transactionss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} ledger_transactionss")
    
    service = Ledger_transactionsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} ledger_transactionss successfully")
        return {"message": f"Successfully deleted {deleted_count} ledger_transactionss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_ledger_transactions(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single ledger_transactions by ID"""
    logger.debug(f"Deleting ledger_transactions with id: {id}")
    
    service = Ledger_transactionsService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Ledger_transactions with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Ledger_transactions not found")
        
        logger.info(f"Ledger_transactions {id} deleted successfully")
        return {"message": "Ledger_transactions deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting ledger_transactions {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")