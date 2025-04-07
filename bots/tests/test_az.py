#!/usr/bin/env python3
import os
import sys
from datetime import datetime, timedelta

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import necessary modules (update imports since we're in the tests folder)
from chat_assistant import ChatAssistant
from code_generation import CodeGenerator
from state_machine_executor import StateMachineExecutor

def main():
    """
    Main function that replicates the test_pipeline_end_to_end functionality
    but without using pytest fixtures.
    """
    # Create instances directly (instead of using fixtures)
    chat_assistant = ChatAssistant()
    code_generator = CodeGenerator()
    state_machine_executor = StateMachineExecutor()
    
    # Define sample conversation (instead of using fixture)
    sample_conversation = [
        {"role": "user", "content": "I need a reminder to take medicine 2 hours after breakfast"},
        {"role": "assistant", "content": "I'll help you set up a reminder. [ChatEnded]"}
    ]

    # 1. Process conversation
    formatted_conv = chat_assistant.format_conversation_history(sample_conversation)
    print(f"Formatted conversation: {formatted_conv[:50]}...")
    
    # 2. Generate code
    summary = {
        "task": "Take medicine 2 hours after breakfast",
        "time": {"time_inferred": "after breakfast"},
        "recurrence": {"type": "once", "details": {"occurrence_frequency": "once"}}
    }
    code = code_generator.generate_code(summary)
    print(f"Generated code: {code[:50]}...")
    
    # 3. Clean and validate
    cleaned_code = state_machine_executor.clean_generated_code(code)
    new_name = state_machine_executor.generate_valid_function_name()
    renamed_code = state_machine_executor.rename_function_in_code(cleaned_code, new_name)
    
    if state_machine_executor.validate_code(renamed_code):
        print(f"Code validated successfully with function name: {new_name}")
    else:
        print("Code validation failed")
        return
    
    # 4. Execute
    activity_data = {"activity": "Eating", "activity_status": "end"}
    namespace = {}
    exec(renamed_code, namespace)
    result = namespace[new_name](
        current_time=datetime.now(),
        activity_data=activity_data
    )
    
    if result:
        print("Test passed! Reminder function returned True as expected.")
    else:
        print("Test failed! Reminder function returned False.")

if __name__ == "__main__":
    main() 