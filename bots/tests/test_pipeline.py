import pytest
from datetime import datetime
import sys
import os
from unittest.mock import MagicMock
import uuid
# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from state_machine_executor import StateMachineExecutor
from summarization import SummarizationBot
from code_generation import CodeGenerator
from code_analyser import analyse_code
from chat_assistant import ChatAssistant

class MockSummarizationBot:
    def summarize_conversation(self, conversation):
        return {
            "content": {
                "task": "Do laundry",
                "date": None,
                "time": {
                    "exact_time": {
                        "start_time": "13:00",
                        "end_time": "22:00"
                    },
                    "time_inferred": "after Dinner"
                },
                "recurrence": {
                    "type": "once",
                    "details": {
                        "days": None,
                        "occurrence_frequency": "once"
                    }
                },
                "priority": "medium"
            }
        }

class MockCodeGenerator:
    def generate_code(self, summary):
        return '''def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == "Eating" and activity_data.get('status') == "end"'''

@pytest.fixture
def pipeline_fixture():
    """Test fixture with test paths"""
    executor = StateMachineExecutor(test_mode=True)
    sample_activity_data = {
        "activity": "Meal_Preparation",
        "activity_status": "end"
    }
    sample_sensor_data = {
        "update": {
            "home_utilities": [
                {
                    "house_id": "AH",
                    "utilities": [
                        {
                            "utility_id": "0015BC0037001F12",
                            "utility_name": "MP Microwave Smart Cable",
                            "status": "On",
                            "components": [{
                                "component_name": "power",
                                "status": "Updated",
                                "value": "5"
                            }]
                        }
                    ]
                }
            ]
        }
    }
    
    # Use mock classes instead of real ones
    summarization_bot = MockSummarizationBot()
    code_generator = MockCodeGenerator()
    chat_assistant = ChatAssistant()
    
    return {
        "activity_data": sample_activity_data,
        "sensor_data": sample_sensor_data,
        "executor": executor,
        "summarizer": summarization_bot,
        "generator": code_generator,
        "assistant": chat_assistant
    }

def create_test_state_machine(code, session_id="test-session"):
    return {
        "stateMachineId": str(uuid.uuid4()),
        "date": datetime.now().strftime("%Y-%m-%d"),
        "conversation_summary": {
            "content": {
                "task": "Do laundry",
                "date": None,
                "time": {
                    "exact_time": {
                        "start_time": "13:00",
                        "end_time": "22:00"
                    },
                    "time_inferred": "after Dinner"
                },
                "recurrence": {
                    "type": "once",
                    "details": {
                        "days": None,
                        "occurrence_frequency": "once"
                    }
                }
            }
        },
        "generated_code": code,
        "analysed_data": {
            "sensors": {},
            "activities": [
                {
                    "activity": "Eating",
                    "status": "end"
                }
            ]
        },
        "execution_history": []
    }

def test_activity_trigger_reminder(pipeline_fixture):
    conversation = "Remind me to take medicine after breakfast."
    summarization = pipeline_fixture["summarizer"].summarize_conversation(conversation)
    transformed_summary = pipeline_fixture["assistant"].transform_summary_for_code_generation(summarization["content"])
    code_output = pipeline_fixture["generator"].generate_code(transformed_summary)
    cleaned_code = pipeline_fixture["executor"].clean_generated_code(code_output)
    renamed_code = pipeline_fixture["executor"].rename_function_in_code(cleaned_code, "test_function")
    assert pipeline_fixture["executor"].validate_code(renamed_code)
    analysed_data = analyse_code(renamed_code)
    assert "sensors" in analysed_data
    assert "activities" in analysed_data

def test_missing_task_data(pipeline_fixture):
    conversation = "Remind me tomorrow."
    summarization = pipeline_fixture["summarizer"].summarize_conversation(conversation)
    transformed_summary = pipeline_fixture["assistant"].transform_summary_for_code_generation(summarization["content"])
    code_output = pipeline_fixture["generator"].generate_code(transformed_summary)
    cleaned_code = pipeline_fixture["executor"].clean_generated_code(code_output)
    renamed_code = pipeline_fixture["executor"].rename_function_in_code(cleaned_code, "test_function")
    assert pipeline_fixture["executor"].validate_code(renamed_code)

def test_inferred_time_handling(pipeline_fixture):
    conversation = "Remind me to take medicine after breakfast."
    summarization = pipeline_fixture["summarizer"].summarize_conversation(conversation)
    transformed_summary = pipeline_fixture["assistant"].transform_summary_for_code_generation(summarization["content"])
    code_output = pipeline_fixture["generator"].generate_code(transformed_summary)
    cleaned_code = pipeline_fixture["executor"].clean_generated_code(code_output)
    renamed_code = pipeline_fixture["executor"].rename_function_in_code(cleaned_code, "test_function")
    assert pipeline_fixture["executor"].validate_code(renamed_code)

def test_sensor_trigger_reminder(pipeline_fixture):
    # Create state machine with complete structure
    state_machine = create_test_state_machine(
        '''def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == "Eating" and activity_data.get('status') == "end"'''
    )
    
    result = pipeline_fixture["executor"].execute_generated_code(
        state_machine,
        datetime.now(),
        {"activity": "Eating", "status": "end"},
        {},
        {}
    )
    
    assert result is True

def test_full_execution_pipeline(pipeline_fixture):
    """Original test for backward compatibility"""
    conversation = "Please remind me to clean the house in 15 minutes after breakfast."
    summarization = pipeline_fixture["summarizer"].summarize_conversation(conversation)
    transformed_summary = pipeline_fixture["assistant"].transform_summary_for_code_generation(summarization["content"])
    code_output = pipeline_fixture["generator"].generate_code(transformed_summary)
    cleaned_code = pipeline_fixture["executor"].clean_generated_code(code_output)
    renamed_code = pipeline_fixture["executor"].rename_function_in_code(cleaned_code, "pipeline_function")       
    
    # Create complete state machine object
    state_machine = {
        "stateMachineId": str(uuid.uuid4()),
        "sessionId": "test-session",
        "generated_code": renamed_code,
        "analysed_data": analyse_code(renamed_code)
    }
    
    current_time = datetime.now()
    result = pipeline_fixture["executor"].execute_generated_code(
        state_machine,
        current_time,
        {"activity": "Eating", "activity_status": "end"},
        {"update": {"home_utilities": []}},
        {}
    )
    assert result is not None
