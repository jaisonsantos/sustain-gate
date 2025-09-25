"""
SSDR Worker for processing background jobs
Handles intake parsing, validation, and export generation
"""
import os
import sys
import redis
import json
import pandas as pd
from rq import Worker, Queue, Connection
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import logging

# Add parent directory to path to import from api
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'api'))

from app.config import settings
from app.models import Intake, DatapointValue, Base
from app.services.dsl_engine import dsl_engine
from app.services.validation import validation_engine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database setup
engine = create_engine(settings.POSTGRES_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Redis connection
redis_conn = redis.from_url(settings.REDIS_URL)

def parse_intake_job(intake_id: str):
    """
    Parse uploaded intake file and extract datapoints
    This is a simplified version - in production would be more sophisticated
    """
    logger.info(f"Processing intake {intake_id}")
    
    db = SessionLocal()
    try:
        # Get intake record
        intake = db.query(Intake).filter(Intake.id == intake_id).first()
        if not intake:
            logger.error(f"Intake {intake_id} not found")
            return
        
        # Find uploaded file
        file_path = None
        for file in os.listdir(settings.INTAKES_DIR):
            if file.startswith(str(intake_id)):
                file_path = os.path.join(settings.INTAKES_DIR, file)
                break
        
        if not file_path:
            logger.error(f"File for intake {intake_id} not found")
            intake.status = "failed"
            db.commit()
            return
        
        # Parse file based on extension
        if file_path.lower().endswith('.csv'):
            df = pd.read_csv(file_path)
        elif file_path.lower().endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file_path)
        else:
            logger.error(f"Unsupported file format: {file_path}")
            intake.status = "failed"
            db.commit()
            return
        
        logger.info(f"Parsed file with {len(df)} rows and columns: {list(df.columns)}")
        
        # Simple mapping for demo - map common column names to canonical keys
        column_mappings = {
            'Electricity_MWh': 'energy.electricity_kwh',
            'Electricity (MWh)': 'energy.electricity_kwh', 
            'Water_m3': 'water.m3_total',
            'Water (m3)': 'water.m3_total',
            'Waste_kg': 'waste.total_kg',
            'Waste (kg)': 'waste.total_kg',
            'Employees': 'employees.count',
            'Employee_Count': 'employees.count'
        }
        
        # Process each row
        for index, row in df.iterrows():
            for col_name, canonical_key in column_mappings.items():
                if col_name in df.columns and pd.notna(row[col_name]):
                    value = row[col_name]
                    
                    # Apply unit conversion if needed (MWh -> kWh)
                    if canonical_key == 'energy.electricity_kwh' and col_name.endswith('MWh'):
                        value = float(value) * 1000  # Convert MWh to kWh
                    
                    # Create datapoint value
                    dp_value = DatapointValue(
                        tenant_id=intake.tenant_id,
                        supplier_id=intake.supplier_id,
                        intake_id=intake.id,
                        key=canonical_key,
                        value_json={
                            "value": value,
                            "unit": get_unit_for_key(canonical_key)
                        },
                        period_start=intake.period_start,
                        period_end=intake.period_end,
                        source_type="upload",
                        confidence=1.0
                    )
                    
                    db.add(dp_value)
        
        # Update intake status
        intake.status = "parsed" 
        db.commit()
        
        logger.info(f"Successfully parsed intake {intake_id}")
        
    except Exception as e:
        logger.error(f"Error parsing intake {intake_id}: {str(e)}")
        if intake:
            intake.status = "failed"
            db.commit()
    finally:
        db.close()

def get_unit_for_key(key: str) -> str:
    """Get default unit for canonical key"""
    unit_map = {
        'energy.electricity_kwh': 'kWh',
        'water.m3_total': 'm3',
        'waste.total_kg': 'kg',
        'employees.count': 'count'
    }
    return unit_map.get(key, 'unit')

def validate_intake_job(intake_id: str):
    """Validate parsed intake data"""
    logger.info(f"Validating intake {intake_id}")
    
    db = SessionLocal()
    try:
        # Get intake and associated datapoints
        intake = db.query(Intake).filter(Intake.id == intake_id).first()
        if not intake:
            return
        
        datapoints = db.query(DatapointValue).filter(
            DatapointValue.intake_id == intake_id
        ).all()
        
        # Convert to validation format
        dp_list = []
        for dp in datapoints:
            dp_list.append({
                "key": dp.key,
                "value_json": dp.value_json,
                "period_start": dp.period_start.isoformat() if dp.period_start else None,
                "period_end": dp.period_end.isoformat() if dp.period_end else None
            })
        
        # Run validation
        errors, warnings = validation_engine.validate_intake(dp_list)
        
        # Update intake status
        if errors:
            intake.status = "rejected"
        else:
            intake.status = "validated"
        
        db.commit()
        
        logger.info(f"Validated intake {intake_id}: {len(errors)} errors, {len(warnings)} warnings")
        
    except Exception as e:
        logger.error(f"Error validating intake {intake_id}: {str(e)}")
    finally:
        db.close()

if __name__ == '__main__':
    # Create queues
    with Connection(redis_conn):
        q = Queue('default', connection=redis_conn)
        
        # Register job functions
        q.enqueue_call = parse_intake_job
        
        # Start worker
        worker = Worker([q], connection=redis_conn)
        logger.info("Starting SSDR worker...")
        worker.work()