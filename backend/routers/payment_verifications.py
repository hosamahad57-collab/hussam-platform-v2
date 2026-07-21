import json
import logging
from typing import List, Optional

from datetime import datetime, date

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from services.payment_verifications import Payment_verificationsService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/entities/payment_verifications", tags=["payment_verifications"])


# ---------- Pydantic Schemas ----------
class Payment_verificationsData(BaseModel):
    """Entity data schema (for create/update)"""
    tenant_id: int
    gateway: str
    reference_number: str
    amount: float
    currency: str = None
    sender_name: str = None
    status: str = None
    verified_at: str = None


class Payment_verificationsUpdateData(BaseModel):
    """Update entity data (partial updates allowed)"""
    tenant_id: Optional[int] = None
    gateway: Optional[str] = None
    reference_number: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    sender_name: Optional[str] = None
    status: Optional[str] = None
    verified_at: Optional[str] = None


class Payment_verificationsResponse(BaseModel):
    """Entity response schema"""
    id: int
    tenant_id: int
    gateway: str
    reference_number: str
    amount: float
    currency: Optional[str] = None
    sender_name: Optional[str] = None
    status: Optional[str] = None
    verified_at: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Payment_verificationsListResponse(BaseModel):
    """List response schema"""
    items: List[Payment_verificationsResponse]
    total: int
    skip: int
    limit: int


class Payment_verificationsBatchCreateRequest(BaseModel):
    """Batch create request"""
    items: List[Payment_verificationsData]


class Payment_verificationsBatchUpdateItem(BaseModel):
    """Batch update item"""
    id: int
    updates: Payment_verificationsUpdateData


class Payment_verificationsBatchUpdateRequest(BaseModel):
    """Batch update request"""
    items: List[Payment_verificationsBatchUpdateItem]


class Payment_verificationsBatchDeleteRequest(BaseModel):
    """Batch delete request"""
    ids: List[int]


# ---------- Routes ----------
@router.get("", response_model=Payment_verificationsListResponse)
async def query_payment_verificationss(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Query payment_verificationss with filtering, sorting, and pagination"""
    logger.debug(f"Querying payment_verificationss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")
    
    service = Payment_verificationsService(db)
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
        logger.debug(f"Found {result['total']} payment_verificationss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid payment_verifications query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying payment_verificationss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/all", response_model=Payment_verificationsListResponse)
async def query_payment_verificationss_all(
    query: str = Query(None, description="Query conditions (JSON string)"),
    sort: str = Query(None, description="Sort field (prefix with '-' for descending)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=2000, description="Max number of records to return"),
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    # Query payment_verificationss with filtering, sorting, and pagination without user limitation
    logger.debug(f"Querying payment_verificationss: query={query}, sort={sort}, skip={skip}, limit={limit}, fields={fields}")

    service = Payment_verificationsService(db)
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
        logger.debug(f"Found {result['total']} payment_verificationss")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.warning(f"Invalid payment_verifications query: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error querying payment_verificationss: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.get("/{id}", response_model=Payment_verificationsResponse)
async def get_payment_verifications(
    id: int,
    fields: str = Query(None, description="Comma-separated list of fields to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get a single payment_verifications by ID"""
    logger.debug(f"Fetching payment_verifications with id: {id}, fields={fields}")
    
    service = Payment_verificationsService(db)
    try:
        result = await service.get_by_id(id)
        if not result:
            logger.warning(f"Payment_verifications with id {id} not found")
            raise HTTPException(status_code=404, detail="Payment_verifications not found")
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching payment_verifications {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("", response_model=Payment_verificationsResponse, status_code=201)
async def create_payment_verifications(
    data: Payment_verificationsData,
    db: AsyncSession = Depends(get_db),
):
    """Create a new payment_verifications"""
    logger.debug(f"Creating new payment_verifications with data: {data}")
    
    service = Payment_verificationsService(db)
    try:
        result = await service.create(data.model_dump())
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create payment_verifications")
        
        logger.info(f"Payment_verifications created successfully with id: {result.id}")
        return result
    except ValueError as e:
        logger.error(f"Validation error creating payment_verifications: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating payment_verifications: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/batch", response_model=List[Payment_verificationsResponse], status_code=201)
async def create_payment_verificationss_batch(
    request: Payment_verificationsBatchCreateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Create multiple payment_verificationss in a single request"""
    logger.debug(f"Batch creating {len(request.items)} payment_verificationss")
    
    service = Payment_verificationsService(db)
    results = []
    
    try:
        for item_data in request.items:
            result = await service.create(item_data.model_dump())
            if result:
                results.append(result)
        
        logger.info(f"Batch created {len(results)} payment_verificationss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch create: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch create failed: {str(e)}")


@router.put("/batch", response_model=List[Payment_verificationsResponse])
async def update_payment_verificationss_batch(
    request: Payment_verificationsBatchUpdateRequest,
    db: AsyncSession = Depends(get_db),
):
    """Update multiple payment_verificationss in a single request"""
    logger.debug(f"Batch updating {len(request.items)} payment_verificationss")
    
    service = Payment_verificationsService(db)
    results = []
    
    try:
        for item in request.items:
            # Only include non-None values for partial updates
            update_dict = {k: v for k, v in item.updates.model_dump().items() if v is not None}
            result = await service.update(item.id, update_dict)
            if result:
                results.append(result)
        
        logger.info(f"Batch updated {len(results)} payment_verificationss successfully")
        return results
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch update: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch update failed: {str(e)}")


@router.put("/{id}", response_model=Payment_verificationsResponse)
async def update_payment_verifications(
    id: int,
    data: Payment_verificationsUpdateData,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing payment_verifications"""
    logger.debug(f"Updating payment_verifications {id} with data: {data}")

    service = Payment_verificationsService(db)
    try:
        # Only include non-None values for partial updates
        update_dict = {k: v for k, v in data.model_dump().items() if v is not None}
        result = await service.update(id, update_dict)
        if not result:
            logger.warning(f"Payment_verifications with id {id} not found for update")
            raise HTTPException(status_code=404, detail="Payment_verifications not found")
        
        logger.info(f"Payment_verifications {id} updated successfully")
        return result
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error updating payment_verifications {id}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating payment_verifications {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.delete("/batch")
async def delete_payment_verificationss_batch(
    request: Payment_verificationsBatchDeleteRequest,
    db: AsyncSession = Depends(get_db),
):
    """Delete multiple payment_verificationss by their IDs"""
    logger.debug(f"Batch deleting {len(request.ids)} payment_verificationss")
    
    service = Payment_verificationsService(db)
    deleted_count = 0
    
    try:
        for item_id in request.ids:
            success = await service.delete(item_id)
            if success:
                deleted_count += 1
        
        logger.info(f"Batch deleted {deleted_count} payment_verificationss successfully")
        return {"message": f"Successfully deleted {deleted_count} payment_verificationss", "deleted_count": deleted_count}
    except Exception as e:
        await db.rollback()
        logger.error(f"Error in batch delete: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Batch delete failed: {str(e)}")


@router.delete("/{id}")
async def delete_payment_verifications(
    id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a single payment_verifications by ID"""
    logger.debug(f"Deleting payment_verifications with id: {id}")
    
    service = Payment_verificationsService(db)
    try:
        success = await service.delete(id)
        if not success:
            logger.warning(f"Payment_verifications with id {id} not found for deletion")
            raise HTTPException(status_code=404, detail="Payment_verifications not found")
        
        logger.info(f"Payment_verifications {id} deleted successfully")
        return {"message": "Payment_verifications deleted successfully", "id": id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting payment_verifications {id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")