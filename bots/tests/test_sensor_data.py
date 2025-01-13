import pytest
from datetime import datetime
import os
import sys
from state_machine_executor import StateMachineExecutor

def test_microwave_usage_pattern(executor):
    """Test microwave usage pattern detection"""
    state_machine = {
        "stateMachineId": "test_microwave",
        "generated_code": """
def reminder(current_time=None, activity_data=None, state_data=None, blackboard=None):
    if state_data:
        microwave_power = state_data.get('microwave_smart_cable', {}).get('power')
        microwave_door = state_data.get('microwave_door_entry_sensor', {}).get('doorStatus')
        
        if microwave_door == '1' or (microwave_power and float(microwave_power) >= 1000):
            return True
    return False
""",
        "analysed_data": {
            "sensors": {
                "microwave_smart_cable": True,
                "microwave_door_entry_sensor": True
            },
            "activities": []
        }
    }

    # Test with microwave power on
    sensor_data = {
        "microwave_smart_cable": {"power": "1400"},
        "microwave_door_entry_sensor": {"doorStatus": "1"}
    }
    
    result = executor.execute_generated_code(
        state_machine,
        datetime.now(),
        None,
        sensor_data,
        {}
    )
    assert result == True
