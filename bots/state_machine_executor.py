import json 
import os
from datetime import datetime, timedelta
import uuid
from loggers.state_machine_logging import state_machine_logger
import requests

# File paths
STATE_MACHINE_FILE = os.path.join("..", "Datastore", "state_machines.json")
BLACKBOARD_FILE = os.path.join("..", "Datastore", "blackboard.json")
SENSOR_MAPPING_FILE = os.path.join("..", "Datastore", "sensor_mapping.json")

# Constants
PARTIAL_MATCH_TIMEOUT = timedelta(minutes=5)

# Load the sensor mapping once at startup
with open(SENSOR_MAPPING_FILE, 'r') as f:
    SENSOR_MAPPING = json.load(f)
state_machine_logger.info("Loaded SENSOR_MAPPING: %s", SENSOR_MAPPING)

def load_state_machines():
    """Load state machines from the JSON file."""
    if os.path.exists(STATE_MACHINE_FILE) and os.path.getsize(STATE_MACHINE_FILE) > 0:
        with open(STATE_MACHINE_FILE, 'r') as file:
            try:
                state_machine_logger.debug("Loading state machines...")
                return json.load(file)
            except json.JSONDecodeError:
                state_machine_logger.warning("JSON file corrupted. Resetting to empty dictionary.")
                return {}
    state_machine_logger.info("No existing state machines found.")
    return {}

def save_state_machines(state_machines):
    """Save state machines back to the JSON file."""
    os.makedirs(os.path.dirname(STATE_MACHINE_FILE), exist_ok=True)
    with open(STATE_MACHINE_FILE, 'w') as file:
        json.dump(state_machines, file, indent=2)
    state_machine_logger.info("State machines saved successfully.")

def load_blackboard():
    """Load blackboard data from the JSON file."""
    if os.path.exists(BLACKBOARD_FILE) and os.path.getsize(BLACKBOARD_FILE) > 0:
        with open(BLACKBOARD_FILE, 'r') as file:
            try:
                state_machine_logger.debug("Loading blackboard data...")
                return json.load(file)
            except json.JSONDecodeError:
                state_machine_logger.warning("Blackboard JSON file corrupted. Resetting to empty dictionary.")
                return {}
    state_machine_logger.info("No existing blackboard data found.")
    return {}

def save_blackboard(blackboard):
    """Save blackboard data to the JSON file."""
    os.makedirs(os.path.dirname(BLACKBOARD_FILE), exist_ok=True)
    with open(BLACKBOARD_FILE, 'w') as file:
        json.dump(blackboard, file, indent=2)
    state_machine_logger.info("Blackboard saved successfully.")

def translate_sensor_data(sensor_data):
    """Translate external sensor names to internal names using the sensor mapping."""
    translated = {SENSOR_MAPPING.get(sensor, sensor): value for sensor, value in sensor_data.items()}
    state_machine_logger.debug("Translated sensor data: %s", translated)
    return translated

def save_state_machine_to_json(session_id, user_id, conversation_summary, generated_code, analysed_data=None):
    """Save a new state machine for a session to the JSON file with sensors stored in a hashmap structure."""
    state_machines = load_state_machines()
    state_machine_id = str(uuid.uuid4())
    
    # Create a state machine entry
    state_machine_entry = {
        "stateMachineId": state_machine_id,
        "date": datetime.now().strftime("%Y-%m-%d"),
        "conversation_summary": conversation_summary,
        "generated_code": generated_code,
    }
    
    # Only include analysed_data if provided
    if analysed_data:
        sensors = {sensor: True for sensor in analysed_data.get("sensors", [])}
        state_machine_entry["analysed_data"] = {
            "sensors": sensors,
            "activities": analysed_data.get("activities", [])
        }

    if session_id not in state_machines:
        state_machines[session_id] = {"userId": user_id, "state_machines": []}
    
    state_machines[session_id]["state_machines"].append(state_machine_entry)
    save_state_machines(state_machines)
    state_machine_logger.info("State machine %s saved successfully.", state_machine_id)

def check_partial_match(state_machine, blackboard, sensor_data=None, activity_data=None):
    """Check if partial data in the blackboard completes the filter conditions."""
    state_machine_id = state_machine["stateMachineId"]
    current_blackboard = blackboard.get(state_machine_id, {})

    state_machine_logger.debug(f"Received activity data for matching: {activity_data}")

    # Combine new data with existing blackboard state
    if sensor_data:
        current_blackboard.setdefault("sensors", {}).update(sensor_data)
    if activity_data:
        current_blackboard.setdefault("activities", []).append(activity_data)

    blackboard[state_machine_id] = current_blackboard
    save_blackboard(blackboard)

    # Log the current blackboard state for debugging
    state_machine_logger.debug("Current blackboard state for state machine %s: %s", state_machine_id, current_blackboard)

    # Check if all required sensors are present
    required_sensors = state_machine["analysed_data"].get("sensors", {})
    all_sensors_present = all(sensor in current_blackboard.get("sensors", {}) for sensor in required_sensors)
    state_machine_logger.debug("Required sensors: %s, All sensors present: %s", required_sensors, all_sensors_present)

    # Separate required activities for better matching
    required_activities = state_machine["analysed_data"].get("activities", [])
    general_activities = [act for act in required_activities if "activity" in act]
    utility_activities = [act for act in required_activities if "utility_id" in act]

    # Match general activities
    all_general_activities_matched = all(
        any(
            stored_activity.get("activity") == activity["activity"] and
            stored_activity.get("status") == activity["status"]
            for stored_activity in current_blackboard.get("activities", [])
        ) for activity in general_activities
    )
    state_machine_logger.debug("Required general activities: %s, All general activities matched: %s", general_activities, all_general_activities_matched)

    # Match utility-based activities
    all_utility_activities_matched = all(
        any(
            stored_activity.get("utility_id") == activity["utility_id"] and
            stored_activity.get("status") == activity["status"]
            for stored_activity in current_blackboard.get("activities", [])
        ) for activity in utility_activities
    )
    state_machine_logger.debug("Required utility activities: %s, All utility activities matched: %s", utility_activities, all_utility_activities_matched)

    # Both sensors and activities need to match for a full match
    return all_sensors_present and all_general_activities_matched and all_utility_activities_matched

def execute_state_machine_code(generated_code, time=None, activity_data=None, state_data=None, blackboard=None):
    """Execute the state machine code by dynamically defining the function and running it."""
    clean_code = generated_code.strip().replace("```python", "").replace("```", "")
    state_machine_logger.info("Executing the following code:\n%s", clean_code)
    
    local_context = {}
    try:
        exec(clean_code, {}, local_context)
        should_trigger_reminder = local_context.get("should_trigger_reminder")
        
        if callable(should_trigger_reminder):
            # Pass only the arguments that should_trigger_reminder expects
            result = should_trigger_reminder(
                time=time, 
                activity_data=activity_data, 
                state_data=state_data, 
                blackboard=blackboard
            )
            state_machine_logger.info("Execution result: %s", result)
            return result
        else:
            state_machine_logger.error("should_trigger_reminder function not found in the code.")
            return None
    except Exception as e:
        state_machine_logger.error("Error executing state machine code: %s", e)
        return None
    
def execute_all_state_machines(time, activity_data, sensor_data=None):
    """Iterate over all stored state machines and execute those that match the conditions."""
    state_machines = load_state_machines()
    blackboard = load_blackboard()
    results = []
    translated_sensor_data = None

    state_machine_logger.info("inside execute all state machines")
    # Translate sensor data
    if sensor_data is not None:
        translated_sensor_data = translate_sensor_data(sensor_data)
    
    state_machine_logger.info("Executing state machines...")

    for session_id, session_data in state_machines.items():
        for state_machine in session_data["state_machines"]:
            state_machine_logger.debug("Checking state machine %s for session %s", state_machine["stateMachineId"], session_id)

            if check_partial_match(state_machine, blackboard, sensor_data=translated_sensor_data, activity_data=activity_data):
                generated_code = state_machine["generated_code"]
                state_machine_logger.info("Executing state machine %s for session %s", state_machine["stateMachineId"], session_id)

                execution_result = execute_state_machine_code(
                    generated_code, time=time, activity_data=activity_data, state_data=translated_sensor_data, blackboard=blackboard
                )
                
                if execution_result is True:
                    notify_api_client("home123", "State machine executed successfully.")

                results.append({
                    "stateMachineId": state_machine["stateMachineId"],
                    "sessionId": session_id,
                    "executionResult": execution_result
                })

                # Clear the blackboard entry once state machine is executed
                blackboard.pop(state_machine["stateMachineId"], None)
                save_blackboard(blackboard)

    state_machine_logger.info("State machine execution results: %s", results)
    return results

def notify_api_client(client_id, message):
    """Send a notification to the client using the /notify API."""
    api_url = "https://localhost:7628/notify"  # Replace with the actual API endpoint
    headers = {
        "Content-Type": "application/json"
        # Include the Authorization header with the JWT token if required:
        # "Authorization": "Bearer <JWT_TOKEN>"
    }
    payload = {
        "clientId": client_id,
        "message": message
    }
    try:
        response = requests.post(api_url, headers=headers, json=payload)
        if response.status_code == 200:
            state_machine_logger.info("Notification sent successfully: %s", response.json())
        else:
            state_machine_logger.error("Failed to send notification. Status: %d, Response: %s",
                                       response.status_code, response.text)
    except requests.exceptions.RequestException as e:
        state_machine_logger.error("Error sending notification: %s", e)