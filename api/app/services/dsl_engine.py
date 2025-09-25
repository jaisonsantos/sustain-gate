"""
DSL Engine for safe data transformations
Supports: select, convert_unit, multiply, divide, round
"""
from typing import Dict, Any, Union
import re

class DSLEngine:
    """Safe DSL interpreter for data transformations"""
    
    UNIT_CONVERSIONS = {
        ("MWh", "kWh"): 1000,
        ("kWh", "MWh"): 0.001,
        ("L", "m3"): 0.001,
        ("m3", "L"): 1000,
        ("kg", "ton"): 0.001,
        ("ton", "kg"): 1000,
    }
    
    def apply_dsl(self, row: Dict[str, Any], dsl_json: Dict[str, Any]) -> Union[float, int, str, None]:
        """Apply DSL transformation to a data row"""
        try:
            return self._evaluate(dsl_json, row)
        except Exception as e:
            raise ValueError(f"DSL evaluation error: {str(e)}")
    
    def _evaluate(self, expr: Dict[str, Any], row: Dict[str, Any]) -> Any:
        """Recursively evaluate DSL expression"""
        if not isinstance(expr, dict):
            return expr
        
        # Select operation
        if "select" in expr:
            return self._select(expr["select"], row)
        
        # Convert unit operation
        if "convert_unit" in expr:
            value = self._evaluate(expr["convert_unit"].get("value", expr.get("from_value")), row)
            from_unit = expr["convert_unit"]["from"]
            to_unit = expr["convert_unit"]["to"]
            return self._convert_unit(value, from_unit, to_unit)
        
        # Arithmetic operations
        if "multiply" in expr:
            operands = expr["multiply"]
            if len(operands) != 2:
                raise ValueError("multiply requires exactly 2 operands")
            a = self._evaluate(operands[0], row)
            b = self._evaluate(operands[1], row)
            return self._safe_multiply(a, b)
        
        if "divide" in expr:
            operands = expr["divide"]
            if len(operands) != 2:
                raise ValueError("divide requires exactly 2 operands")
            a = self._evaluate(operands[0], row)
            b = self._evaluate(operands[1], row)
            return self._safe_divide(a, b)
        
        if "sum" in expr:
            operands = expr["sum"]
            return sum(self._evaluate(op, row) for op in operands)
        
        if "avg" in expr:
            operands = expr["avg"]
            values = [self._evaluate(op, row) for op in operands]
            return sum(values) / len(values) if values else 0
        
        # Utility operations
        if "round" in expr:
            value = self._evaluate(expr.get("value"), row)
            decimals = expr["round"]
            return round(float(value), decimals)
        
        if "bound_0_100" in expr:
            value = self._evaluate(expr["bound_0_100"], row)
            return max(0, min(100, float(value)))
        
        if "regex_extract" in expr:
            text = str(self._evaluate(expr["regex_extract"]["text"], row))
            pattern = expr["regex_extract"]["pattern"]
            match = re.search(pattern, text)
            return match.group(1) if match else None
        
        # Coalesce (return first non-null value)
        if "coalesce" in expr:
            for operand in expr["coalesce"]:
                value = self._evaluate(operand, row)
                if value is not None:
                    return value
            return None
        
        raise ValueError(f"Unknown DSL operation: {list(expr.keys())}")
    
    def _select(self, selector: Dict[str, str], row: Dict[str, Any]) -> Any:
        """Select value from row using selector"""
        if "from" in selector:
            path = selector["from"]
            if path.startswith("csv.col:"):
                col_name = path[8:]  # Remove "csv.col:" prefix
                return row.get(col_name)
            else:
                return row.get(path)
        
        raise ValueError("select requires 'from' field")
    
    def _convert_unit(self, value: Union[float, int], from_unit: str, to_unit: str) -> float:
        """Convert value between units"""
        if value is None:
            return None
        
        if from_unit == to_unit:
            return float(value)
        
        conversion_key = (from_unit, to_unit)
        if conversion_key in self.UNIT_CONVERSIONS:
            return float(value) * self.UNIT_CONVERSIONS[conversion_key]
        
        raise ValueError(f"Unsupported unit conversion: {from_unit} to {to_unit}")
    
    def _safe_multiply(self, a: Any, b: Any) -> float:
        """Safely multiply two values"""
        if a is None or b is None:
            return None
        return float(a) * float(b)
    
    def _safe_divide(self, a: Any, b: Any) -> float:
        """Safely divide two values"""
        if a is None or b is None:
            return None
        if float(b) == 0:
            raise ValueError("Division by zero")
        return float(a) / float(b)

# Global DSL engine instance
dsl_engine = DSLEngine()