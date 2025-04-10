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

"""
In the 'working' code in test_pipeline.py,
The code generator is mocked. Here, it is *not*.
The summarizer is mocked. Here, is it too.

In test_pipeline, the code returns False (the state machine executes but the conditions are not met (4o speculates))
"""

def summarize_conversation(conversation):
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

def test_full_execution_pipeline():
    """Original test for backward compatibility"""
    conversation = "Please remind me to clean the house in 15 minutes after breakfast."
    summarization = summarize_conversation(conversation)
    transformed_summary = ChatAssistant.transform_summary_for_code_generation(summarization["content"])
    code_output = CodeGenerator.generate_code(transformed_summary) # A difference between this code and the code in the test_pipeline.py file is that THEY use a mock code generator
    """
    code_output = '''def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == "Eating" and activity_data.get('status') == "end"'''
    """
    
    # Create an instance of StateMachineExecutor
    executor = StateMachineExecutor()
    cleaned_code = executor.clean_generated_code(code_output)
    renamed_code = executor.rename_function_in_code(cleaned_code, "pipeline_function")       
    
    # Create complete state machine object
    state_machine = {
        "stateMachineId": str(uuid.uuid4()),
        "sessionId": "test-session",
        "generated_code": renamed_code,
        "analysed_data": analyse_code(renamed_code)
    }
    
    current_time = datetime.now()
    result = executor.execute_generated_code(
        state_machine,
        current_time,
        {"activity": "Eating", "activity_status": "end"},
        {"update": {"home_utilities": []}},
        {}
    )
    return result

def process_sensor_updates(sensor_updates_generator):
    """
    For each sensor update, process each reminder
    """
    for sensor_update in sensor_updates_generator:
        # process_reminders
        print(f"Processing sensor update: {sensor_update}")
    
    return False

if __name__ == "__main__":
  results = []
  for i in range(10):
    result = test_full_execution_pipeline()
    results.append(result)

  # assert result is not None # Sometimes False, sometimes None

  # 2/10 runs the test is successful.
  print(results) # [None, False, None, None, None, None, None, None, False, None]
  