"""
Data validation service for SSDR
Validates datapoint values against rules and constraints
"""
from typing import List, Dict, Any, Tuple
from datetime import date

class ValidationError:
    def __init__(self, field: str, message: str, severity: str = "error"):
        self.field = field
        self.message = message
        self.severity = severity  # "error", "warning"
    
    def to_dict(self):
        return {
            "field": self.field,
            "message": self.message,
            "severity": self.severity
        }

class ValidationEngine:
    """Validation engine for datapoint values"""
    
    # Valid units for each datapoint type
    VALID_UNITS = {
        "energy.electricity_kwh": ["kWh", "MWh"],
        "energy.fuels_liters": ["L", "m3"],
        "purchases.total_eur": ["EUR", "USD"],
        "freight.ton_km_road": ["ton·km", "kg·km"],
        "freight.ton_km_sea": ["ton·km", "kg·km"],
        "freight.ton_km_air": ["ton·km", "kg·km"],
        "water.m3_total": ["m3", "L"],
        "waste.total_kg": ["kg", "ton"],
        "packaging.kg_total": ["kg", "ton"],
        "materials.recycled_content_pct": ["%"],
        "energy.renewable_pct": ["%"],
        "site.count": ["count"],
        "employees.count": ["count"],
        "policy.has_esg_policy": ["boolean"],
        "certifications.list": ["list"]
    }
    
    # Value ranges for numeric fields
    VALUE_RANGES = {
        "materials.recycled_content_pct": (0, 100),
        "energy.renewable_pct": (0, 100),
        "site.count": (1, 1000),
        "employees.count": (1, 100000)
    }
    
    def validate_intake(self, datapoints: List[Dict[str, Any]]) -> Tuple[List[ValidationError], List[ValidationError]]:
        """
        Validate a list of datapoint values
        Returns tuple of (errors, warnings)
        """
        errors = []
        warnings = []
        
        for dp in datapoints:
            # Validate individual datapoint
            dp_errors, dp_warnings = self.validate_datapoint(dp)
            errors.extend(dp_errors)
            warnings.extend(dp_warnings)
        
        # Cross-field validations
        cross_errors, cross_warnings = self.validate_cross_field(datapoints)
        errors.extend(cross_errors)
        warnings.extend(cross_warnings)
        
        return errors, warnings
    
    def validate_datapoint(self, datapoint: Dict[str, Any]) -> Tuple[List[ValidationError], List[ValidationError]]:
        """Validate single datapoint"""
        errors = []
        warnings = []
        
        key = datapoint.get("key")
        value = datapoint.get("value_json", {}).get("value")
        unit = datapoint.get("value_json", {}).get("unit")
        
        if not key:
            errors.append(ValidationError("key", "Datapoint key is required"))
            return errors, warnings
        
        # Type validation
        if value is None:
            warnings.append(ValidationError(key, "Value is missing", "warning"))
            return errors, warnings
        
        # Unit validation
        if key in self.VALID_UNITS and unit not in self.VALID_UNITS[key]:
            errors.append(ValidationError(
                key, 
                f"Invalid unit '{unit}'. Expected one of: {', '.join(self.VALID_UNITS[key])}"
            ))
        
        # Range validation for numeric fields
        if key in self.VALUE_RANGES:
            min_val, max_val = self.VALUE_RANGES[key]
            try:
                num_value = float(value)
                if not (min_val <= num_value <= max_val):
                    errors.append(ValidationError(
                        key,
                        f"Value {num_value} is outside valid range [{min_val}, {max_val}]"
                    ))
            except (ValueError, TypeError):
                errors.append(ValidationError(key, "Value must be numeric"))
        
        # Percentage fields specific validation
        if key.endswith("_pct"):
            try:
                pct_value = float(value)
                if pct_value < 0 or pct_value > 100:
                    errors.append(ValidationError(key, "Percentage must be between 0 and 100"))
                elif pct_value > 90:
                    warnings.append(ValidationError(key, "Very high percentage value", "warning"))
            except (ValueError, TypeError):
                errors.append(ValidationError(key, "Percentage value must be numeric"))
        
        # Energy consumption thresholds (business logic warnings)
        if key == "energy.electricity_kwh":
            try:
                kwh_value = float(value)
                if kwh_value > 100000:  # 100 MWh
                    warnings.append(ValidationError(
                        key, 
                        "Electricity consumption seems unusually high", 
                        "warning"
                    ))
                elif kwh_value == 0:
                    warnings.append(ValidationError(
                        key,
                        "Zero electricity consumption - please verify",
                        "warning"
                    ))
            except (ValueError, TypeError):
                pass
        
        # Period validation
        period_start = datapoint.get("period_start")
        period_end = datapoint.get("period_end")
        
        if period_start and period_end:
            try:
                start_date = date.fromisoformat(period_start) if isinstance(period_start, str) else period_start
                end_date = date.fromisoformat(period_end) if isinstance(period_end, str) else period_end
                
                if start_date >= end_date:
                    errors.append(ValidationError(
                        key,
                        "Period start date must be before end date"
                    ))
            except (ValueError, TypeError):
                warnings.append(ValidationError(key, "Invalid date format in period", "warning"))
        
        return errors, warnings
    
    def validate_cross_field(self, datapoints: List[Dict[str, Any]]) -> Tuple[List[ValidationError], List[ValidationError]]:
        """Cross-field validation rules"""
        errors = []
        warnings = []
        
        # Create lookup for easy access
        dp_values = {}
        for dp in datapoints:
            key = dp.get("key")
            value = dp.get("value_json", {}).get("value")
            if key and value is not None:
                try:
                    dp_values[key] = float(value)
                except (ValueError, TypeError):
                    dp_values[key] = value
        
        # Rule: If electricity consumption is 0, renewable % should be 0
        electricity = dp_values.get("energy.electricity_kwh", 0)
        renewable_pct = dp_values.get("energy.renewable_pct")
        
        if electricity == 0 and renewable_pct and renewable_pct > 0:
            warnings.append(ValidationError(
                "energy.renewable_pct",
                "Renewable percentage should be 0 when electricity consumption is 0",
                "warning"
            ))
        
        # Rule: Waste should be reasonable compared to employee count
        waste_kg = dp_values.get("waste.total_kg")
        employee_count = dp_values.get("employees.count")
        
        if waste_kg and employee_count:
            waste_per_employee = waste_kg / employee_count
            if waste_per_employee > 1000:  # 1 ton per employee seems high
                warnings.append(ValidationError(
                    "waste.total_kg",
                    f"Waste per employee ({waste_per_employee:.1f} kg) seems high",
                    "warning"
                ))
        
        return errors, warnings

# Global validation engine instance
validation_engine = ValidationEngine()