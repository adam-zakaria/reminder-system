# code_generation.py

from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from sujendraPromptTemplate import SujendraPromptTemplate
import config
import json

# Define prompt template for Code Generation LLM
code_generation_prompt_template = """
You are tasked with generating a Python function that handles reminders based on user activity recognition, state data from specific sensors identified by their **sensor names**, and optionally, the current time in **ISO 8601 format**. The function should check **only the necessary inputs** (time, activity data, or state data) to trigger the reminder. If an input is not relevant for the reminder, it should be **ignored**, and **no conditions should be created** for it. Additionally, the **blackboard** should only be used when tracking states in **state machine logic**. All functionality must be implemented inside **one single function** using only `if` and `else` statements.

You will be provided with a JSON object that summarizes the user's reminder request. Use this information to tailor the function you generate, but do not alter the function's inputs or outputs. The JSON summary is context for you, not part of the function interface.

### Reminder Request Summary (Context for you, not part of the function):
```json
{
  "task": "Clean the kitchen",
  "date": "tomorrow",
  "time": {
    "exact_time": {
      "start_time": null,
      "end_time": null
    },
    "time_inferred": "morning"
  },
  "recurrence": {
    "type": "once",
    "details": {
      "days": null,
      "occurrence_frequency": "once"
    }
  },
  "priority": "medium"
}
```

Use this information to guide your function creation, focusing on the relevant aspects (e.g., time of day, specific sensors) without changing the function's interface.

### Sensor Information:
The function should use the following sensors based on their **sensor names** to trigger reminders according to their types and locations. These names can be mapped to **physical device IDs** as needed. Each sensor’s state will indicate On or Off.

- **Smart Cables**:
  - `microwave_smart_cable` (Microwave Smart Cable, kitchen)
  - `bedroom_extension_cable` (Bedroom Extension Cable, Kids Bedroom)
  - `living_room_smart_cable` (Living Room Smart Cable, Living Room)
- **Motion Sensors**:
  - `kitchen_motion_sensor` (Kitchen Motion Sensor, Kitchen)
  - `dining_room_motion_sensor` (Dining Room Motion Sensor, Dining Room)
  - `master_bedroom_motion_sensor` (Master Bedroom Motion Sensor, Master Bedroom)
  - `living_room_motion_sensor` (Living Room Motion Sensor, DLiving Room Motion)
- **Entry Sensors**:
  - `fridge_entry_sensor` (Fridge Entry, kitchen)
  - `main_door_entry_sensor` (Main Door Entry, Hallway)
  - `silverware_drawer_entry_sensor` (Silverware Drawer Entry, Kitchen)
  - `microwave_door_entry_sensor` (Microwave Door Entry, kitchen)
- **Temperature/Humidity Sensors**:
  - `stove_temp_humidity_sensor` (Stove Temp/Humidity Sensor, Kitchen)
  - `living_room_temp_humidity_sensor` (Living Room Temp/Humidity Sensor, Living Room)
- **Vibration Sensors**:
  - `bathroom_toilet_vibration_sensor` (Bathroom Toilet Vibration Sensor, Master Bathroom)
- **Vayyar UWB Sensors**:
  - `master_bedroom_uwb_sensor` (Master Bedroom UWB Sensor, Master Bedroom)
- **Emfit Bed Sensor**:
  - `master_bedroom_bed_sensor` (Master Bedroom Bed Sensor, Master Bedroom)

### Function Requirements:
1. **Handle the reminder conditions**: The function should check the provided inputs such as ISO time, activity data, and state data from the **sensor names**, and ensure that **all required conditions** are met to trigger the reminder. Use only relevant inputs based on the reminder type.

   For example:
   - For a time-based reminder, only the time should be checked.
   - For an activity-based reminder, the activity should be checked, and activities have a **start** or **end** status (e.g., `Meal_Preparation` with `activity_status == 'start'`).
   - For sensor-based reminders, the state of specific devices should be checked.
   
2. **Check activity and state data**:
   - **Activity Data**: Trigger the reminder if a specified activity starts (e.g., `Meal_Preparation`), where `activity_status == 'start'`. Detectable activities are:
     - `'Relax'`
     - `'Meal_Preparation'`
     - `'Leave_Home'`
     - `'Sleeping'`
     - `'Eating'`
     - `'Bed_To_Toilet'`
     - `'Enter_Home'`
   - **State Data (Sensors)**: Use state data from the relevant sensors identified by their **sensor names**. For example:
     - **Entry Detected**: Trigger if a door or cabinet is opened.
     - **Motion Detected**: Trigger if motion is detected by any motion sensor.
     - **Temperature Changes**: Trigger based on temperature or humidity changes.
     - **Vibration Detected**: Trigger if vibrations are detected by vibration sensors.

3. **Time Handling**: The function should compare the current time (provided in ISO 8601 format) with the target time. The time comparison logic should be **flexible based on the user input**, not hardcoded. 

4. **Blackboard Use for State Machines Only**: The **blackboard** should only be used to track states in **state machine scenarios**. For non-state machine scenarios, the blackboard should be ignored.

5. **Trigger the reminder**: The function should return `True` **only if all relevant conditions are met** (time, activity, and state data). If any condition fails, it should return `False`.

6. **Handle missing inputs**: The function should work with any combination of inputs. If some inputs are not provided or not required, they should be ignored.

7. The entire functionality must be implemented inside **one single function** using only `if` and `else` statements.

### Function Inputs (Unchanged):
- `time`: (Optional) The current time in **ISO 8601 format** (e.g., `'2024-09-09T08:00:00'`).
- `activity_data`: (Optional) A dictionary containing human activity recognition. The `activity` can be one of the following: `'Relax'`, `'Meal_Preparation'`, `'Leave_Home'`, `'Sleeping'`, `'Eating'`, `'Bed_To_Toilet'`, or `'Enter_Home'`, and `activity_status` should be `'start'`.
- `state_data`: (Optional) A dictionary containing sensor values identified by their **sensor names** (e.g., `doorStatus`, `motionDetected`, `temp`, `vibration`).
- `blackboard`: (Optional) A dictionary used to track and store state information in **state machine logic**.

### Expected Behavior:
- The function should check **only the necessary inputs** (ISO time, activity, or state data) based on the reminder type to determine if the reminder should be triggered.
- The function should return `True` **only if all relevant conditions** for triggering the reminder are met; otherwise, return `False`.
- The function should work even if some inputs are not provided or are not needed.
- The **blackboard** should only be used for state machine tracking. It should be ignored in non-state machine scenarios.
- The entire functionality must be implemented inside **one function** using only `if` and `else` statements.

### Task:
Generate **only the Python code** for this function, tailored to the reminder request specified in the JSON summary but maintaining the original input and output structure. The function should be directly usable in a script. No explanations or extra text are needed—just the Python code in a single function.

Request Summary Json:
{reminder_json}

"""

# Define Code Generation LLM function
def get_code_generation_chain():
    code_generation_prompt = SujendraPromptTemplate.from_json_template(
        input_variables=["reminder_json"],
        template=code_generation_prompt_template
    )
    code_generation_llm = ChatOpenAI(
        api_key=config.OPENAI_API_KEY,
        model="gpt-4o",  # Adjust the model name as needed
        temperature=0  # Set the temperature to 0 for deterministic outputs
    )
    return LLMChain(llm=code_generation_llm, prompt=code_generation_prompt)

# Function to generate Python code based on reminder summary
def generate_code(reminder_summary: dict) -> str:
    try:
        # Convert the reminder summary to JSON string format
        reminder_json = json.dumps(reminder_summary)
        
        # Get the code generation LLM chain
        chain = get_code_generation_chain()
        
        # Invoke the chain to generate Python code
        generated_code = chain.invoke({"reminder_json": reminder_json})
        
        # Extract and return the generated code from the result
        return generated_code["text"]
    
    except Exception as e:
        return f"Error generating code: {str(e)}"