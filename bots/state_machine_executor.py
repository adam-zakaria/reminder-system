import json
import os
from datetime import datetime, timedelta
import uuid
from threading import Timer
import requests
import re
from inspect import signature, isfunction
from loggers.state_machine_logging import state_machine_logger


# File paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_MACHINE_FILE = os.path.join(BASE_DIR, "..", "Datastore", "state_machines.json")
BLACKBOARD_FILE = os.path.join(BASE_DIR, "..", "Datastore", "blackboard.json")
SENSOR_MAPPING_FILE = os.path.join(BASE_DIR, "..", "Datastore", "sensor_mapping.json")

# Constants
PARTIAL_MATCH_TIMEOUT = timedelta(minutes=5)

# Load the sensor mapping once at startup
with open(SENSOR_MAPPING_FILE, 'r') as f:
    SENSOR_MAPPING = json.load(f)


class StateMachineExecutor:
    def __init__(self, home_id: str = None, user_id: str = None, test_mode=False):
        """Initialize with home_id, user_id and test mode option"""
        self.home_id = home_id
        self.user_id = user_id
        if test_mode:
            test_dir = os.path.join(os.path.dirname(__file__), "tests", "test_data")
            self.__state_machine_file = os.path.join(test_dir, "test_state_machines.json")
            self.__sensor_mapping_file = os.path.join(test_dir, "test_sensor_mapping.json")
        else:
            self.__state_machine_file = STATE_MACHINE_FILE
            self.__sensor_mapping_file = SENSOR_MAPPING_FILE
        self.__state_machines = self.load_state_machines()
        self.__blackboard = self.load_blackboard()
        self.__sensor_mapping = self.load_sensor_mapping()

    @property
    def state_machines(self) -> dict:
        return self.__state_machines

    @state_machines.setter
    def state_machines(self, value: dict) -> None:
        self.__state_machines = value

    @property
    def blackboard(self) -> dict:
        return self.__blackboard

    @blackboard.setter
    def blackboard(self, value: dict) -> None:
        self.__blackboard = value

    def load_state_machines(self) -> dict:
        """Load state machines from the JSON file."""
        if os.path.exists(STATE_MACHINE_FILE) and os.path.getsize(STATE_MACHINE_FILE) > 0:
            with open(STATE_MACHINE_FILE, 'r') as file:
                try:
                    state_machine_logger.debug("Loading state machines...")
                    data = json.load(file)
                    # Initialize structure if not exists
                    if "homes" not in data:
                        data = {"homes": {}}
                    return data
                except json.JSONDecodeError:
                    state_machine_logger.warning("JSON file corrupted. Resetting to empty dictionary.")
                    return {"homes": {}}
        state_machine_logger.info("No existing state machines found.")
        return {"homes": {}}

    def save_state_machines(self) -> None:
        """Save state machines back to the JSON file."""
        os.makedirs(os.path.dirname(STATE_MACHINE_FILE), exist_ok=True)
        with open(STATE_MACHINE_FILE, 'w') as file:
            json.dump(self.__state_machines, file, indent=2)
        state_machine_logger.info("State machines saved successfully.")

    def load_blackboard(self) -> dict:
        """Load blackboard data from the JSON file."""
        if os.path.exists(BLACKBOARD_FILE) and os.path.getsize(BLACKBOARD_FILE) > 0:
            with open(BLACKBOARD_FILE, 'r') as file:
                try:
                    state_machine_logger.debug("Loading blackboard data...")
                    data = json.load(file)
                    # Initialize structure if not exists
                    if "homes" not in data:
                        data = {"homes": {}}
                    return data
                except json.JSONDecodeError:
                    state_machine_logger.warning("Blackboard JSON file corrupted. Resetting to empty dictionary.")
                    return {"homes": {}}
        state_machine_logger.info("No existing blackboard data found.")
        return {"homes": {}}

    def save_blackboard(self) -> None:
        """Save blackboard data to the JSON file."""
        os.makedirs(os.path.dirname(BLACKBOARD_FILE), exist_ok=True)
        with open(BLACKBOARD_FILE, 'w') as file:
            json.dump(self.__blackboard, file, indent=2)
        state_machine_logger.info("Blackboard saved successfully.")

    def load_sensor_mapping(self) -> dict:
        """Load sensor mapping from the JSON file."""
        if os.path.exists(self.__sensor_mapping_file) and os.path.getsize(self.__sensor_mapping_file) > 0:
            with open(self.__sensor_mapping_file, 'r') as file:
                try:
                    state_machine_logger.debug("Loading sensor mapping...")
                    data = json.load(file)
                    # Initialize structure if not exists
                    if "homes" not in data:
                        data = {"homes": {}}
                    return data
                except json.JSONDecodeError:
                    state_machine_logger.warning("Sensor mapping JSON file corrupted. Resetting to empty dictionary.")
                    return {"homes": {}}
        state_machine_logger.info("No existing sensor mapping found.")
        return {"homes": {}}

    def save_sensor_mapping(self) -> None:
        """Save sensor mapping to the JSON file."""
        os.makedirs(os.path.dirname(self.__sensor_mapping_file), exist_ok=True)
        with open(self.__sensor_mapping_file, 'w') as file:
            json.dump(self.__sensor_mapping, file, indent=2)
        state_machine_logger.info("Sensor mapping saved successfully.")

    def get_home_sensor_mapping(self) -> dict:
        """Get sensor mapping for current home."""
        if not self.home_id:
            return {}
        return self.__sensor_mapping.get("homes", {}).get(self.home_id, {})

    def update_home_sensor_mapping(self, mapping: dict) -> None:
        """Update sensor mapping for current home."""
        if not self.home_id:
            raise ValueError("home_id is required to update sensor mapping")
        
        if "homes" not in self.__sensor_mapping:
            self.__sensor_mapping["homes"] = {}
        self.__sensor_mapping["homes"][self.home_id] = mapping
        self.save_sensor_mapping()

    def translate_sensor_data(self, sensor_data: dict) -> dict:
        """Translate external sensor names to internal names using the sensor mapping."""
        if not self.home_id:
            return sensor_data
            
        home_mapping = self.get_home_sensor_mapping()
        translated = {home_mapping.get(sensor, sensor): value for sensor, value in sensor_data.items()}
        state_machine_logger.debug("Translated sensor data: %s", translated)
        return translated

    def execute_state_machine_task(self, state_machine_id: str) -> None:
        """
        Execute the state machine logic based on its ID.
        
        :param state_machine_id: Unique ID of the state machine.
        """
        state_machine = self.get_state_machine_by_id(state_machine_id)
        
        if not state_machine:
            state_machine_logger.error(f"State machine with ID {state_machine_id} not found.")
            return

        # Execute the generated code associated with the state machine
        execution_result = self.execute_generated_code(state_machine)
        state_machine_logger.info(f"Execution result for state machine {state_machine_id}: {execution_result}")

    def get_state_machine_by_id(self, state_machine_id: str) -> dict:
        """
        Retrieve a state machine entry by its ID from the JSON data.

        Args:
        - state_machine_id (str): The ID of the state machine to retrieve.

        Returns:
        - dict: The matching state machine entry, or None if not found.
        """
        for session_id, session_data in self.__state_machines.items():
            for state_machine in session_data.get("state_machines", []):
                if state_machine.get("stateMachineId") == state_machine_id:
                    return state_machine
        return None

    def is_time_in_future(self, date: str, time_str: str) -> bool:
        """
        Check if the given time on a specific date is in the future.

        :param date: The date (e.g., 'today', '2024-09-10').
        :param time_str: The time string in 'HH:MM' format.
        :return: True if the time is in the future, False otherwise.
        """
        target_date = scheduler.parse_date(date)
        target_time = datetime.strptime(time_str, "%H:%M").time()
        target_datetime = datetime.combine(target_date, target_time)

        return target_datetime > datetime.now()

    def get_current_time_formatted(self) -> str:
        """
        Get the current time formatted as 'HH:MM'.

        :return: Current time as a string in 'HH:MM' format.
        """
        return datetime.now().strftime("%H:%M")

    def adjust_date_for_passed_times(self, date: str, start_time: str, end_time: str = None) -> str:
        """
        Adjust date if both start and end times have passed.
        Returns original date or 'tomorrow' if adjustment needed.
        """
        if not end_time:
            return date

        # Convert times to datetime objects
        current = datetime.now()
        target_date = scheduler.parse_date(date)
        
        start_time_obj = datetime.strptime(start_time, "%H:%M").time()
        end_time_obj = datetime.strptime(end_time, "%H:%M").time()
        
        start_dt = datetime.combine(target_date, start_time_obj)
        end_dt = datetime.combine(target_date, end_time_obj)
        
        # If both times have passed, schedule for tomorrow
        if current > start_dt and current > end_dt:
            return "tomorrow"
        return date

    def schedule_time_based_state_machine(self, state_machine_id: str, time_details: dict, recurrence_type: str, date: str, occurrence: str) -> None:
        start_time = time_details.get("start_time")
        end_time = time_details.get("end_time")

        if not start_time:
            state_machine_logger.warning(f"Start time is required for scheduling state machine {state_machine_id}.")
            return

        # Check and adjust date if needed
        adjusted_date = self.adjust_date_for_passed_times(date, start_time, end_time)
        
        # Update times if needed for current day
        if adjusted_date == date and not self.is_time_in_future(date, start_time):
            start_time = self.get_current_time_formatted()
            # If date was adjusted to tomorrow, no need to modify times
            if adjusted_date != date:
                state_machine_logger.debug(f"Date adjusted to {adjusted_date}, keeping original times")
                start_time = time_details.get("start_time")

        # Schedule activation
        try:
            scheduler.add_task(
                date=adjusted_date,
                start_time=start_time,
                end_time=end_time,
                recurrence_type=recurrence_type,
                function_name="activate_state_machine",
                occurrence=occurrence,
                args=[state_machine_id]
            )
            state_machine_logger.info(f"Scheduled activation for state machine {state_machine_id} at {start_time}")
            
            # Schedule deactivation if end_time provided
            if end_time:
                scheduler.add_task(
                    date=adjusted_date,
                    start_time=end_time,
                    end_time=None,
                    recurrence_type=recurrence_type,
                    function_name="deactivate_state_machine",
                    occurrence=occurrence,
                    args=[state_machine_id]
                )
                state_machine_logger.info(f"Scheduled deactivation for state machine {state_machine_id} at {end_time}")
        except Exception as e:
            state_machine_logger.error(f"Error scheduling state machine {state_machine_id}: {e}")

    def activate_state_machine(self, state_machine_id: str) -> None:
        """Activate a state machine by setting its active flag to True."""
        for session_id, session_data in self.__state_machines.items():
            for state_machine in session_data["state_machines"]:
                if state_machine["stateMachineId"] == state_machine_id:
                    state_machine["active"] = True
                    self.save_state_machines()
                    state_machine_logger.info(f"Activated state machine {state_machine_id}")

    def deactivate_state_machine(self, state_machine_id: str) -> None:
        """Deactivate a state machine by setting its active flag to False."""
        for session_id, session_data in self.__state_machines.items():
            for state_machine in session_data["state_machines"]:
                if state_machine["stateMachineId"] == state_machine_id:
                    state_machine["active"] = False
                    self.save_state_machines()
                    state_machine_logger.info(f"Deactivated state machine {state_machine_id}")

    def get_user_state_machines(self) -> list:
        """Get state machines for current home and user."""
        if not self.home_id or not self.user_id:
            return []
        return self.__state_machines.get("homes", {}).get(self.home_id, {}).get("users", {}).get(self.user_id, {}).get("state_machines", [])

    def get_user_blackboard(self) -> dict:
        """Get blackboard data for current home and user."""
        if not self.home_id or not self.user_id:
            return {}
        return self.__blackboard.get("homes", {}).get(self.home_id, {}).get("users", {}).get(self.user_id, {})

    def save_state_machine_to_json(self, session_id: str, user_id: str, conversation_summary: dict, generated_code: str, analysed_data: dict = None) -> None:
        """
        Save a new state machine for a session to the JSON file with sensors stored in a hashmap structure.
        """
        if not self.home_id:
            raise ValueError("home_id is required to save state machine")

        __uuid = uuid.uuid4()
        state_machine_id = str(__uuid)

        # Generate a unique name for the generated code
        generated_code_name = self.generate_valid_function_name()
        
        # Clean and rename the function in the generated code
        cleaned_code = self.clean_generated_code(generated_code)
        renamed_code = self.rename_function_in_code(cleaned_code, generated_code_name)
        
        # Validate the renamed code
        if not self.validate_code(cleaned_code):
            raise ValueError("Generated code is not valid")
            
        # Create a state machine entry
        state_machine_entry = {
            "stateMachineId": state_machine_id,
            "date": datetime.now().strftime("%Y-%m-%d"),
            "conversation_summary": conversation_summary,
            "generated_code": renamed_code
        }
        
        # Only include analysed_data if provided
        if analysed_data:
            sensors = {sensor: True for sensor in analysed_data.get("sensors", [])}
            state_machine_entry["analysed_data"] = {
                "sensors": sensors,
                "activities": analysed_data.get("activities", [])
            }

        # Initialize home and user structure if it doesn't exist
        if "homes" not in self.__state_machines:
            self.__state_machines["homes"] = {}
        if self.home_id not in self.__state_machines["homes"]:
            self.__state_machines["homes"][self.home_id] = {"users": {}}
        if "users" not in self.__state_machines["homes"][self.home_id]:
            self.__state_machines["homes"][self.home_id]["users"] = {}
        if user_id not in self.__state_machines["homes"][self.home_id]["users"]:
            self.__state_machines["homes"][self.home_id]["users"][user_id] = {"state_machines": []}
        
        # Append the new state machine to the user's list
        self.__state_machines["homes"][self.home_id]["users"][user_id]["state_machines"].append(state_machine_entry)
        self.save_state_machines()
        state_machine_logger.info("State machine %s saved successfully for home %s, user %s", 
                                state_machine_id, self.home_id, user_id)

        # Schedule time-based state machine activation if applicable
        time_details = conversation_summary.get("content", {}).get("time", {}).get("exact_time", {})
        recurrence = conversation_summary.get("content", {}).get("recurrence", {}).get("type", "once")
        date = conversation_summary.get("content", {}).get("date") or "today"
        occurrence = conversation_summary.get("content", {}).get("recurrence", {}).get("details", {}).get("occurrence", "once")
        
        if time_details and recurrence:
            self.schedule_time_based_state_machine(state_machine_id, time_details, recurrence, date, occurrence)

    def execute_generated_code(self, state_machine: dict, time=None, activity_data=None, sensor_data=None, blackboard=None):
        try:
            state_machine_logger.debug(f"Executing generated code for state machine: {state_machine['stateMachineId']}")
            generated_code = state_machine.get("generated_code", "")
            state_machine_logger.debug(f"Generated code: {generated_code}")
            
            if not generated_code:
                return "Error: No generated code found"

            # Create function from generated code
            exec(generated_code)
            func_name = generated_code.split("def ")[1].split("(")[0]
            state_machine_logger.debug(f"Function name: {func_name}")
            
            func = locals()[func_name]
            #print(generated_code)
            #result = func(time=time, activity_data=activity_data, sensor_data=sensor_data, blackboard=blackboard)
            result = func(sensor_data=sensor_data)
            state_machine_logger.debug(f"Execution result: {result}")
            return result
        except Exception as e:
            error_message = f"Error executing generated code: {e}, Code: {generated_code}"
            state_machine_logger.error(error_message)
            return error_message

    def check_partial_match(self, state_machine: dict, sensor_data: dict = None, activity_data: dict = None) -> bool:
        """Check if partial data in the blackboard completes the filter conditions."""
        state_machine_id = state_machine["stateMachineId"]
        current_blackboard = self.__blackboard.get(state_machine_id, {})

        state_machine_logger.debug(f"Received activity data for matching: {activity_data}")
        
        # Combine new data with existing blackboard state
        if sensor_data:
            current_blackboard.setdefault("sensors", {}).update(sensor_data)
        if activity_data:
            # Ensure activity data includes status
            if "activity" in activity_data and "status" in activity_data:
                current_blackboard.setdefault("activities", []).append(activity_data)

        self.__blackboard[state_machine_id] = current_blackboard
        self.save_blackboard()

        state_machine_logger.debug("Current blackboard state for state machine %s: %s", 
                                 state_machine_id, current_blackboard)

        # Check sensors
        required_sensors = state_machine["analysed_data"].get("sensors", {})
        all_sensors_present = all(sensor in current_blackboard.get("sensors", {}) 
                                for sensor in required_sensors)

        # Get activities with status requirements
        required_activities = state_machine["analysed_data"].get("activities", [])
        general_activities = [act for act in required_activities 
                             if "activity" in act and "status" in act]
        utility_activities = [act for act in required_activities 
                             if "utility_id" in act and "status" in act]

        # Match activities with status check
        all_general_activities_matched = all(
            any(
                stored_activity.get("activity") == activity["activity"] and
                stored_activity.get("status") == activity["status"]
                for stored_activity in current_blackboard.get("activities", [])
            ) for activity in general_activities
        )

        # Match utility activities with status
        all_utility_activities_matched = all(
            any(
                stored_activity.get("utility_id") == activity["utility_id"] and
                stored_activity.get("status") == activity["status"]
                for stored_activity in current_blackboard.get("activities", [])
            ) for activity in utility_activities
        )

        state_machine_logger.debug(f"Activities matched: General={all_general_activities_matched}, Utility={all_utility_activities_matched}")
        return all_sensors_present and all_general_activities_matched and all_utility_activities_matched

    def execute_all_state_machines(self, time=None, activity_data=None, sensor_data=None):
        """Execute all state machines with given data"""
        state_machine_logger.debug("Executing all state machines with data: %s", activity_data)
        
        try:
            # Load state machines
            state_machines = self.state_machines if isinstance(self.state_machines, dict) else json.loads(self.state_machines)
            modified = False
            
            # If home_id and user_id are set, only execute for that user
            if self.home_id and self.user_id:
                user_machines = self.get_user_state_machines()
                for state_machine in user_machines:
                    if not isinstance(state_machine, dict) or "stateMachineId" not in state_machine:
                        continue
                    
                    # Get execution status
                    execution_history = state_machine.get("execution_history", [])
                    occurrence_frequency = state_machine.get("conversation_summary", {}).get("content", {}).get("recurrence", {}).get("details", {}).get("occurrence_frequency")
                    
                    # Skip if already executed for one-time tasks
                    if occurrence_frequency == "once" and execution_history:
                        state_machine_logger.debug(f"Skipping already executed state machine: {state_machine['stateMachineId']}")
                        continue
                    
                    if self.check_partial_match(state_machine, sensor_data, activity_data):
                        result = self.execute_generated_code(
                            state_machine,
                            time,
                            activity_data,
                            sensor_data,
                            self.get_user_blackboard()
                        )
                        
                        if result is True and not any(exec.get("activity") == activity_data for exec in execution_history):
                            # Record execution
                            state_machine.setdefault("execution_history", []).append({
                                "timestamp": datetime.now().isoformat(),
                                "activity": activity_data
                            })
                            modified = True
                            
                            # Send notification
                            task = state_machine.get("conversation_summary", {}).get("content", {}).get("task", "")
                            time_details = state_machine.get("conversation_summary", {}).get("content", {}).get("time", {}).get("exact_time", {})
                            
                            if task and time_details:
                                message = f"Now that you've finished your tea, it's a good time to get the laundry done!" # Harcoded for testing
                                notify_api_client(self.user_id, message)
            else:
                # Execute for all homes and users
                for home_id, home_data in state_machines.get("homes", {}).items():
                    for user_id, user_data in home_data.get("users", {}).items():
                        for state_machine in user_data.get("state_machines", []):
                            if not isinstance(state_machine, dict) or "stateMachineId" not in state_machine:
                                continue
                            
                            # Get execution status
                            execution_history = state_machine.get("execution_history", [])
                            occurrence_frequency = state_machine.get("conversation_summary", {}).get("content", {}).get("recurrence", {}).get("details", {}).get("occurrence_frequency")
                            
                            # Skip if already executed for one-time tasks
                            if occurrence_frequency == "once" and execution_history:
                                state_machine_logger.debug(f"Skipping already executed state machine: {state_machine['stateMachineId']}")
                                continue
                            
                            if self.check_partial_match(state_machine, sensor_data, activity_data):
                                result = self.execute_generated_code(
                                    state_machine,
                                    time,
                                    activity_data,
                                    sensor_data,
                                    self.__blackboard.get("homes", {}).get(home_id, {}).get("users", {}).get(user_id, {})
                                )
                                
                                if result is True and not any(exec.get("activity") == activity_data for exec in execution_history):
                                    # Record execution
                                    state_machine.setdefault("execution_history", []).append({
                                        "timestamp": datetime.now().isoformat(),
                                        "activity": activity_data
                                    })
                                    modified = True
                                    
                                    # Send notification
                                    task = state_machine.get("conversation_summary", {}).get("content", {}).get("task", "")
                                    time_details = state_machine.get("conversation_summary", {}).get("content", {}).get("time", {}).get("exact_time", {})
                                    
                                    if task and time_details:
                                        message = f"Now that you've finished your tea, it's a good time to get the laundry done!" # Harcoded for testing
                                        notify_api_client(user_id, message)
            
            # Save changes
            if modified:
                self.save_state_machines()
                state_machine_logger.info("State machines updated with execution history")
                
        except Exception as e:
            state_machine_logger.error(f"Error in execute_all_state_machines: {str(e)}")
            raise

    def validate_code(self, code: str) -> bool:
        """
        Validate the generated code for syntax errors.
        """
        try:
            compile(code, '<string>', 'exec')
            return True
        except SyntaxError as e:
            state_machine_logger.error(f"Syntax error in generated code: {e}")
            return False

    def clean_generated_code(self, code: str) -> str:
        """
        Clean the generated code by removing unnecessary characters and formatting properly.
        """
        # Remove triple backticks and language identifier
        cleaned_code = code.strip("```python\n").strip("\n```")
        
        # Split into lines and remove empty lines at start/end
        lines = [line for line in cleaned_code.split('\n') if line.strip()]
        
        # Join with actual newlines
        return '\n'.join(lines)

    def rename_function_in_code(self, code: str, new_function_name: str) -> str:
        """
        Rename the function in the generated code.
        """
        # Use regular expressions to find and replace the function name
        pattern = r'def\s+(\w+)\s*\('
        replacement = f'def {new_function_name}('
        renamed_code = re.sub(pattern, replacement, code, count=1)
        return renamed_code
    
    def generate_valid_function_name(self) -> str:
        """Generate a valid Python function name."""
        # Generate base name with uuid
        unique_id = str(uuid.uuid4())
        
        # Replace hyphens with underscores and ensure starts with 'reminder'
        valid_name = f"reminder_{unique_id.replace('-', '_')}"
        
        # Remove any other invalid characters
        valid_name = re.sub(r'[^0-9a-zA-Z_]', '', valid_name)
        
        return valid_name

def notify_api_client(client_id: str, message: str) -> None:
    """Send a notification to the client using sticky note format."""
    api_url = "http://localhost:7628/notify"
    headers = {"Content-Type": "application/json"}
    
    # Generate unique ID for the notification
    notification_id = str(uuid.uuid4())
    
    client_id = "ep6"  # Hardcoded client ID for testing
    # Create message structure matching sendMessageToClient format
    payload = {
        "clientId": client_id,
        "action": "add",
        "id": notification_id,
        "stickyNote": {
            "title": message,
            "content": "",
            "notificationSoundID": 1,
            "instructions": [],
            "lightCategoryId": 3
        }
    }
    
    try:
        response = requests.post(api_url, headers=headers, json=payload)
        if response.status_code == 200:
            state_machine_logger.info(f"Notification sent successfully: {response.json()}")
        else:
            state_machine_logger.error(f"Failed to send notification. Status: {response.status_code}, Response: {response.text}")
    except requests.exceptions.RequestException as e:
        state_machine_logger.error(f"Error sending notification: {str(e)}")