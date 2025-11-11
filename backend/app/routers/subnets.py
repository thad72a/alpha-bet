from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from ..services.bittensor_client import (
    get_all_subnets_summary,
    get_subnet_info,
)

router = APIRouter()


@router.get("", response_model=Dict[int, Dict[str, Any]])
async def list_subnets():
    try:
        return await get_all_subnets_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{netuid}/info", response_model=Dict[str, Any])
async def get_subnet(netuid: int):
    try:
        return await get_subnet_info(netuid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


