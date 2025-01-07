import pytest
import os
import sys
from datetime import datetime

# Add the current directory (bots) to Python path
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

# Now import directly from the modules
from state_machine_executor import StateMachineExecutor
from summarization import SummarizationBot
from code_generation import CodeGenerator
from chat_assistant import ChatAssistant

@pytest.fixture
def formatted_sensor_data():
    """Fixture providing formatted sensor data based on real examples"""
    return {
        "update": {
            "home_utilities": [{
                "house_id": "AH",
                "utilities": [
                    {
                        "utility_id": "0015BC001E01211C",
                        "utility_name": "MP Microwave Entry2",
                        "status": "On",
                        "components": [{
                            "component_name": "doorStatus",
                            "status": "Updated",
                            "value": "1",
                            "time": 1723052070225
                        }]
                    },
                    {
                        "utility_id": "0015BC0037001F12",
                        "utility_name": "MP Microwave Smart Cable",
                        "status": "On",
                        "components": [{
                            "component_name": "power",
                            "status": "Updated",
                            "value": "1400",
                            "time": 1723052071134
                        }]
                    }
                ]
            }]
        }
    }

@pytest.fixture
def activity_sequence():
    """Fixture providing a sequence of activity events"""
    return [
        {
            "activity": "Meal_Preparation",
            "activity_status": "start",
            "timestamp": datetime.now().isoformat()
        },
        {
            "activity": "Meal_Preparation",
            "activity_status": "end",
            "timestamp": datetime.now().isoformat()
        }
    ]

@pytest.fixture
def executor():
    """Fixture providing StateMachineExecutor instance"""
    return StateMachineExecutor()

@pytest.fixture
def sample_state_machine():
    """Fixture providing a sample state machine configuration"""
    return {
        "stateMachineId": "test_id",
        "generated_code": """
def reminder(current_time=None, activity_data=None, state_data=None, blackboard=None):
    if activity_data and activity_data.get('activity') == 'Meal_Preparation':
        if activity_data.get('activity_status') == 'end':
            return True
    if state_data:
        microwave = state_data.get('microwave_smart_cable', {})
        if microwave.get('power') == '1400':
            return True
    return False
""",
        "analysed_data": {
            "sensors": {"microwave_smart_cable": True},
            "activities": [{"activity": "Meal_Preparation", "status": "end"}]
        }
    }
