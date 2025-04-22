import pytest
from datetime import datetime
import sys
import os
from unittest.mock import MagicMock
import uuid
# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import time

from state_machine_executor import StateMachineExecutor
from summarization import SummarizationBot
from code_generation import CodeGenerator
from code_analyser import analyse_code
from chat_assistant import ChatAssistant
sys.path.append('/Users/azakaria/Code/neu/reminder-system/bots/mvp/mqtt_client')
from subscribe import sensor_update_queue

state_machines = []
def create_reminder(conversation):
    # i.e. "Please remind me to look at the sticky notes when I'm in the office"
    # summarization = summarize_conversation(conversation)

    # Don't use the summarization bot for now
    #summarization_bot = SummarizationBot()
    #summarization = summarization_bot.summarize_conversation(conversation)
    #transformed_summary = ChatAssistant.transform_summary_for_code_generation(summarization["content"])

    code_output = CodeGenerator.generate_code(conversation)

    # Create an instance of StateMachineExecutor
    executor = StateMachineExecutor()
    cleaned_code = executor.clean_generated_code(code_output)
    renamed_code = executor.rename_function_in_code(cleaned_code, "mvp_function")       
    # If the same level of validation is desired as internally in the StateMachineExecutor
    # valid = executor.validate_code(renamed_code)  # This step is missing in your test
    
    # Create complete state machine object
    state_machine = {
        "stateMachineId": str(uuid.uuid4()),
        "sessionId": "test-session",
        "generated_code": renamed_code,
        "analysed_data": analyse_code(renamed_code),
        "conversation": conversation,
    }
    state_machines.append(state_machine)

def send_notification(title, content, client_id="ep6", notification_sound_id=1, light_category_id=1):
    """
    Send a sticky note notification to the websocket server.
    
    Args:
        title (str): Title of the sticky note
        content (str): Content of the sticky note
        client_id (str): Client ID to send the notification to
        notification_sound_id (int): Sound ID for the notification
        light_category_id (int): Light category ID
        
    Returns:
        bool: True if notification was sent successfully, False otherwise
    """
    import requests
    
    # Define the server URL
    url = "http://localhost:7628/notify"
    
    # Create a unique ID for this reminder
    notification_id = f"reminder_{uuid.uuid4()}"
    
    # Define the payload
    payload = {
        "clientId": client_id,
        "action": "add",
        "id": notification_id,
        "stickyNote": {
            "title": title,
            "content": content,
            "notificationSoundID": notification_sound_id,
            "instructions": [],
            "lightCategoryId": light_category_id
        }
    }
    
    try:
        # Send the request
        response = requests.post(url, json=payload)
        print(f"Notification sent - Status Code: {response.status_code}")
        return response.status_code == 200
    except Exception as e:
        print(f"Failed to send notification: {e}")
        return False

def process_sensor_update(state_machine, sensor_update):
    current_time = datetime.now()
    executor = StateMachineExecutor()
    result = executor.execute_generated_code(
        state_machine,
        current_time,
        {"activity": "Eating", "activity_status": "end"},
        sensor_update,
        {}
    )
    
    # If reminder triggered, send sticky note notification
    if result is True:
        # Get the original conversation as the reminder text
        reminder_text = state_machine.get("conversation", "Reminder triggered")
        
        # Send notification with the original conversation as content
        send_notification(
            title="Reminder",
            content=state_machine["conversation"]
        )
    
    return result


def process_sensor_updates(sensor_updates_generator):
    """
    For each sensor update, process each reminder
    """
    print("process_sensor_updates()")
    start_time = time.time()
    while True:
        # Time ensures that the sensor updates are processed at least every 10 seconds 
        print(f"start_time: {start_time} ---- time.time(): {time.time()}")
        if ((time.time() - start_time) >= 10) or (not sensor_update_queue.empty()):
            print("Time initiated processing")
            try:
                sensor_update = sensor_update_queue.get(timeout=0.1)
                print('Got sensor update')
            except Exception as e:
                print(f"Queue empty or error getting sensor update: {e}")
                sensor_update = None

            # Process each state machine with this sensor update
            for state_machine in state_machines:
                print("process_sensor_update()")
                result = process_sensor_update(state_machine, sensor_update)
                if result:
                    print(f"Reminder triggered: {result}")
            start_time = time.time()