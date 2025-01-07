import pytest
from datetime import datetime
import os
import json
from state_machine_executor import StateMachineExecutor

@pytest.fixture
def executor():
    return StateMachineExecutor()

@pytest.fixture
def sample_state_machine():
    return {
        "stateMachineId": "test_id",
        "generated_code": """
def reminder(current_time=None, activity_data=None, state_data=None, blackboard=None):
    if activity_data and activity_data.get('activity') == 'Meal_Preparation' and activity_data.get('activity_status') == 'end':
        return True
    return False
""",
        "analysed_data": {
            "sensors": {},
            "activities": [{"activity": "Meal_Preparation", "status": "end"}]
        }
    }

def test_state_machine_creation(executor):
    """Test creating and saving a new state machine"""
    executor.save_state_machine_to_json(
        session_id="test_session",
        user_id="test_user",
        conversation_summary={"content": {"task": "Test task"}},
        generated_code="def reminder(): return True",
        analysed_data={"sensors": [], "activities": []}
    )
    
    state_machines = executor.load_state_machines()
    assert "test_session" in state_machines
    assert len(state_machines["test_session"]["state_machines"]) > 0

def test_execute_state_machine(executor, sample_state_machine):
    """Test executing a state machine with matching activity data"""
    current_time = datetime.now()
    activity_data = {
        "activity": "Meal_Preparation",
        "activity_status": "end"
    }
    
    result = executor.execute_generated_code(
        sample_state_machine,
        current_time,
        activity_data,
        {},
        {}
    )
    assert result == True

def test_partial_match_handling(executor, sample_state_machine):
    """Test partial matching with activity data"""
    activity_data = {
        "activity": "Meal_Preparation",
        "activity_status": "start"
    }
    
    # First update should store in blackboard but not match
    match = executor.check_partial_match(
        sample_state_machine,
        activity_data=activity_data
    )
    assert match == False
    
    # Second update with matching status should complete the match
    activity_data["activity_status"] = "end"
    match = executor.check_partial_match(
        sample_state_machine,
        activity_data=activity_data
    )
    assert match == True

def test_sensor_data_handling(executor):
    """Test handling of sensor data translation and execution"""
    sensor_data = {
        "update": {
            "home_utilities": [{
                "house_id": "AH",
                "utilities": [{
                    "utility_id": "test_id",
                    "utility_name": "MP Microwave Smart Cable",
                    "status": "On",
                    "components": [{
                        "component_name": "power",
                        "status": "Updated",
                        "value": "1400"
                    }]
                }]
            }]
        }
    }
    
    # Create a state machine that checks for microwave power
    code = """
def reminder(current_time=None, activity_data=None, state_data=None, blackboard=None):
    if state_data and state_data.get('microwave_smart_cable', {}).get('power') == '1400':
        return True
    return False
"""
    
    state_machine = {
        "stateMachineId": "test_sensor",
        "generated_code": code,
        "analysed_data": {
            "sensors": {"microwave_smart_cable": True},
            "activities": []
        }
    }
    
    result = executor.execute_generated_code(
        state_machine,
        datetime.now(),
        None,
        sensor_data,
        {}
    )
    assert result == True

def test_time_based_activation(executor):
    """Test scheduling and activation of time-based state machines"""
    from datetime import timedelta
    
    # Create a future time for testing
    future_time = (datetime.now() + timedelta(minutes=5)).strftime("%H:%M")
    
    # Schedule a state machine for future activation
    executor.schedule_time_based_state_machine(
        "test_id",
        {"start_time": future_time},
        "once",
        "today",
        "once"
    )
    
    # Verify the state machine gets activated
    executor.activate_state_machine("test_id")
    state_machines = executor.load_state_machines()
    
    # Check if any matching state machine is active
    found_active = False
    for session in state_machines.values():
        for machine in session.get("state_machines", []):
            if machine.get("stateMachineId") == "test_id" and machine.get("active", False):
                found_active = True
                break
    
    assert found_active
