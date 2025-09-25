from fastapi import APIRouter, Depends
from typing import List, Dict
from ..deps import get_current_user
from ..models import AppUser

router = APIRouter()

# 15 canonical ESRS datapoints as defined in blueprint
CANONICAL_DATAPOINTS = [
    {
        "key": "energy.electricity_kwh",
        "type": "numeric",
        "unit": "kWh",
        "description": "Total electricity consumption"
    },
    {
        "key": "energy.fuels_liters",
        "type": "numeric", 
        "unit": "L",
        "description": "Total fuel consumption (diesel, gasoline, LPG)"
    },
    {
        "key": "purchases.total_eur",
        "type": "numeric",
        "unit": "EUR",
        "description": "Total purchases value"
    },
    {
        "key": "freight.ton_km_road",
        "type": "numeric",
        "unit": "ton·km", 
        "description": "Road freight transport"
    },
    {
        "key": "freight.ton_km_sea",
        "type": "numeric",
        "unit": "ton·km",
        "description": "Sea freight transport"
    },
    {
        "key": "freight.ton_km_air", 
        "type": "numeric",
        "unit": "ton·km",
        "description": "Air freight transport"
    },
    {
        "key": "water.m3_total",
        "type": "numeric",
        "unit": "m³",
        "description": "Total water consumption"
    },
    {
        "key": "waste.total_kg",
        "type": "numeric", 
        "unit": "kg",
        "description": "Total waste generated"
    },
    {
        "key": "packaging.kg_total",
        "type": "numeric",
        "unit": "kg", 
        "description": "Total packaging materials"
    },
    {
        "key": "materials.recycled_content_pct",
        "type": "numeric",
        "unit": "%",
        "description": "Recycled content percentage"
    },
    {
        "key": "energy.renewable_pct",
        "type": "numeric",
        "unit": "%",
        "description": "Renewable energy percentage"
    },
    {
        "key": "site.count",
        "type": "integer",
        "unit": "count",
        "description": "Number of sites"
    },
    {
        "key": "employees.count",
        "type": "integer", 
        "unit": "count",
        "description": "Employee count (average period)"
    },
    {
        "key": "policy.has_esg_policy",
        "type": "boolean",
        "unit": "boolean",
        "description": "Has ESG policy in place"
    },
    {
        "key": "certifications.list",
        "type": "array",
        "unit": "list", 
        "description": "List of certifications (ISO 14001, 9001, etc.)"
    }
]

@router.get("/")
async def get_datapoints(
    current_user: AppUser = Depends(get_current_user)
) -> List[Dict]:
    """
    Get canonical datapoint definitions
    Returns the 15 core ESRS datapoints
    """
    return CANONICAL_DATAPOINTS