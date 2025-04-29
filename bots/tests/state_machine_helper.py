from datetime import datetime
import sys
import os
import uuid
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import time
from state_machine_executor import StateMachineExecutor
from code_analyser import analyse_code
sys.path.append('../bots/mvp/mqtt_client')
from subscribe import sensor_update_queue
import openai

# Configure OpenAI
openai_api_key = os.environ.get("OPENAI_API_KEY")
client = openai.OpenAI(api_key=openai_api_key)

state_machines = []

def create_reminder(conversation):
    # generate reminder code AKA state machine code
    code_output = client.responses.create(
        model="gpt-4o-2024-11-20",
        instructions=open('system_prompt.txt', 'r').read(), # system_prompt.txt is in project root, this will probably break
        input=conversation,
    ).output_text

    # Create state machine object (includes metadata)
    executor = StateMachineExecutor()
    cleaned_code = executor.clean_generated_code(code_output)
    renamed_code = executor.rename_function_in_code(cleaned_code, "mvp_function")       
    state_machine = {
        "stateMachineId": str(uuid.uuid4()),
        "sessionId": "test-session",
        "generated_code": renamed_code,
        "analysed_data": analyse_code(renamed_code),
        "conversation": conversation,
    }

    # add state machine to list of state machines
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

def execute_state_machine(state_machine, sensor_update):
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

def execute_state_machines(sensor_update_queue):
    """
    For each sensor update, process each reminder
    
    Args:
        sensor_update_queue (queue.Queue): Queue containing sensor updates
    """
    start_time = time.time()
    while True:
        # Execute state machines at least every 10 seconds or when there is a sensor update
        time_update = ((time.time() - start_time) >= 10)
        sensor_update = not sensor_update_queue.empty()
        if time_update or sensor_update:
            if sensor_update:
                sensor_update = sensor_update_queue.get(timeout=0.1)

            # Execute all state machines
            print("Executing state machines from the beginning", flush=True)
            for state_machine in state_machines[:]:  # Create a copy of the list for safe iteration
                result = execute_state_machine(state_machine, sensor_update)
                if result:
                    print(f"Reminder triggered: {result}")
                    # Remove the triggered state machine from the list
                    state_machines.remove(state_machine)
                    print(f"State machine removed. {len(state_machines)} remaining.")
            start_time = time.time()