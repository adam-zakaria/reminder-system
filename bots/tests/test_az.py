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

def test_full_execution_pipeline():
    """Original test for backward compatibility"""
    conversation = "Please remind me to clean the house in 15 minutes after breakfast."
    summarization = summarize_conversation(conversation)
    transformed_summary = transform_summary_for_code_generation(summarization["content"])
    code_output = generate_code(transformed_summary)
    cleaned_code = clean_generated_code(code_output)
    renamed_code = rename_function_in_code(cleaned_code, "pipeline_function")       
    
    # Create complete state machine object
    state_machine = {
        "stateMachineId": str(uuid.uuid4()),
        "sessionId": "test-session",
        "generated_code": renamed_code,
        "analysed_data": analyse_code(renamed_code)
    }
    
    current_time = datetime.now()
    result = .execute_generated_code(
        state_machine,
        current_time,
        {"activity": "Eating", "activity_status": "end"},
        {"update": {"home_utilities": []}},
        {}
    )
    assert result is not None
