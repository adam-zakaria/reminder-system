from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from sujendraPromptTemplate import SujendraPromptTemplate
from config import OPENAI_API_KEY
import json
from typing import Dict

class CodeGenerator:
  
    def __init__(self):
      self.dummy ='''def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == "Eating" and activity_data.get('status') == "end"'''
    
    # Define prompt template for Code Generation LLM
    __code_generation_prompt_template: str = """
    You are tasked with generating a Python function that handles reminders based on user activity recognition and optional delays. The function should prioritize activity-based reminders when provided, but also be able to handle reminders with no activity or sensor data, relying only on explicitly mentioned delays. The function should calculate and handle delays using the provided `current_time` argument, which is a Python `datetime` object, **only when delays are explicitly mentioned in the task description**. If no delay is mentioned, the function should trigger the reminder immediately.

    The reminder summary is provided **only for context to design the function**. Use the information in the summary to understand the structure and behavior of the function, but the summary itself will not be an input to the function. Instead, the function inputs will include `current_time`, `activity_data`, `state_data`, and `blackboard`.

    The function should check **only the necessary inputs** (activity data, state data, or delay) to trigger the reminder. If an input is not relevant for the reminder, it should be **ignored**, and **no conditions should be created** for it. Additionally, the **blackboard** should only be used when tracking states in **state machine logic**. All functionality must be implemented inside **one single function** using only `if` and `else` statements.

    **Special Requirements:**
    1. Design the function based on the context provided in the reminder summary, but do not use the summary as an input.
    2. Avoid hardcoding any values (e.g., "10 minutes"). Instead, dynamically extract and compute conditions from the provided inputs.
    3. Write clear and concise logic that directly addresses the requirements while avoiding unnecessary complexity or over-engineering.
    4. Ensure the function operates correctly for any combination of inputs, including cases where only a delay is provided or where activity and sensor data are included.
    5. Use the `current_time` argument (a Python `datetime` object) to calculate delays dynamically and handle reminder triggering.
    6. Verify that the function fulfills all requirements without introducing errors.

    **Special Rules**:
    1. If the word "after" or any similar term is used before an activity in the task description, it usually indicates the end of the activity. Handle such cases accordingly by interpreting the condition as occurring after the activity ends.
    2. If no activity or sensor data is provided, and the reminder only specifies a delay, calculate the delay from `current_time` and trigger the reminder after the specified time.
    3. Incorporate delays **only when explicitly mentioned in the task description**. If no delay is explicitly mentioned, the function should not introduce any delay and should trigger the reminder immediately.

    ### Reminder Summary (Context for Function Design):
    {
      "task": "Take medicine in 10 minutes",
      "date": "today",
      "time_inferred": null,
      "recurrence": {
        "type": "once",
        "details": {
          "days": null,
          "occurrence_frequency": "once"
        }
      },
      "priority": "high"
    }

    Use this reminder summary to understand the logic and design of the function. The reminder does not include activity or sensor inputs, but explicitly mentions a delay.

    ### Sensor Information:
    You are generating code to work with a reminder system that receives sensor data from smart home devices. Your function will receive translated sensor data in the `sensor_data` parameter.

    ## Available Sensors and How to Access Them

    The translation logic creates the following sensor structures. Check sensors using this pattern:
    `sensor_data.get('sensor_name', {}).get('property')`

    1. **Motion Sensors** (format: `{room}_motion_sensor`):
       - Properties: `motion` (boolean), `last_motion` (timestamp), `location` (string)
       - Examples:
         - `kitchen_motion_sensor`
         - `living_room_motion_sensor`
         - `dining_room_motion_sensor`
         - `master_bedroom_motion_sensor`
       - Example check: `sensor_data.get('kitchen_motion_sensor', {}).get('motion') == True`
       - **IMPORTANT**: Motion sensors are the primary way to detect presence in a room

    2. **Entry/Contact Sensors**:
       - `main_door_entry_sensor` (for main doors)
       - `microwave_door_entry_sensor` (for microwave)
       - `fridge_entry_sensor` (for refrigerator)
       - `{room}_entry_sensor` (general format)
       - Properties: `status` (boolean), `location` (string)
       - Example check: `sensor_data.get('microwave_door_entry_sensor', {}).get('status') == True`

    3. **Temperature/Humidity Sensors** (format: `{room}_temp_humidity_sensor`):
       - Properties: `temp` (number), `humidity` (number), `location` (string)
       - Examples:
         - `living_room_temp_humidity_sensor`
         - `stove_temp_humidity_sensor`
       - Example temperature check: `sensor_data.get('living_room_temp_humidity_sensor', {}).get('temp') > 20`
       - Example humidity check: `sensor_data.get('living_room_temp_humidity_sensor', {}).get('humidity') < 50`

    4. **Presence Sensors**:
       - `master_bedroom_bed_sensor` (for bed presence)
         - Properties: `presence` (boolean), `location` (string)
         - Example check: `sensor_data.get('master_bedroom_bed_sensor', {}).get('presence') == True`

    5. **Power Monitoring**:
       - `microwave_smart_cable` (for microwave power usage)
       - `bedroom_extension_cable` (for bedroom devices)
       - `living_room_smart_cable` (for living room devices)
       - Properties: `power` (number)
       - Example check: `sensor_data.get('microwave_smart_cable', {}).get('power') > 0`
       
    ## Sample Room-Specific Checks:
    1. To check if someone is in the kitchen:
       `sensor_data.get('kitchen_motion_sensor', {}).get('motion') == True`
       
    2. To check if someone is in the living room:
       `sensor_data.get('living_room_motion_sensor', {}).get('motion') == True`
       
    3. To check if someone is in bed:
       `sensor_data.get('master_bedroom_bed_sensor', {}).get('presence') == True`

    ### Function Requirements:
    1. **Handle the reminder conditions**: The function should dynamically parse and check the provided inputs such as task description, activity data, state data, or delay to determine if the reminder should be triggered.
       - For reminders with no activity or sensor data, calculate the delay using the `current_time` argument and trigger the reminder after the specified time.

    2. **Check activity and minimal state data**:
       - **Activity Data**: Trigger the reminder if a specified activity starts or ends (e.g., `'Meal_Preparation'` with `activity_status == 'start'` or inferred end conditions). Detectable activities are:
         - `'Relax'`
         - `'Meal_Preparation'`
         - `'Leave_Home'`
         - `'Sleeping'`
         - `'Eating'`
         - `'Bed_To_Toilet'`
         - `'Enter_Home'`
       - **State Data (Sensors)**: Use sensor data structure described above to check for relevant conditions.

    3. **Handle Delays Using `current_time`**:
       - Use the provided `current_time` argument (a Python `datetime` object) to calculate delays **only when explicitly mentioned in the task description** (e.g., `"10 minutes after breakfast"` implies a delay). 
       - Dynamically calculate the delay duration from the inputs and compute the target time.
       - If no delay is mentioned, trigger the reminder immediately without delay calculation.

    4. **Blackboard Use for State Machines Only**: The **blackboard** should only be used to track states in **state machine scenarios**. For non-state machine scenarios, the blackboard should be ignored.

    5. **Trigger the reminder**: The function should return `True` **only if all relevant conditions are met** (parsed reminder details, activity, state data, or delay). If any condition fails, it should return `False`.

    6. **Handle missing inputs**: The function should work with any combination of inputs. If no activity or sensor data is provided, the function should rely solely on the delay if specified.

    7. **Write simple, correct code**: Avoid unnecessary complexity, and ensure the function is easy to understand and maintain.

    8. The entire functionality must be implemented inside **one single function** using only `if` and `else` statements.

    ### Function Inputs:
    - `current_time`: (Required) A `datetime` object representing the current time.
    - `activity_data`: (Optional) A dictionary containing human activity recognition. The `activity` can be one of the following: `'Relax'`, `'Meal_Preparation'`, `'Leave_Home'`, `'Sleeping'`, `'Eating'`, `'Bed_To_Toilet'`, or `'Enter_Home'`, and `activity_status` should be `'start'` or `'end'`.
    - `sensor_data`: (Optional) A dictionary containing sensor values identified by their **sensor names** as described in the Sensor Information section.
    - `blackboard`: (Optional) A dictionary used to track and store state information in **state machine logic**.

    ### Expected Behavior:
    - The function should dynamically parse the inputs (current time, activity data, sensor data) to determine if the reminder should be triggered.
    - The function should return `True` **only if all relevant conditions** for triggering the reminder are met; otherwise, return `False`.
    - The function should work even if some inputs are not provided or are not needed.
    - The **blackboard** should only be used for state machine tracking. It should be ignored in non-state machine scenarios.
    - The entire functionality must be implemented inside **one function** using only `if` and `else` statements.

    ### Task:
    Generate **only the Python code** for this function based on the inputs and behavior described above. The function must calculate delays using the `current_time` argument when explicitly mentioned. **Do not include any text, explanations, or comments in the output—just the Python code.**

    Request Summary Json:
    {reminder_json}

    """


    @staticmethod
    def get_code_generation_chain() -> LLMChain:
        code_generation_prompt = SujendraPromptTemplate.from_json_template(
            input_variables=["reminder_json"],
            template=CodeGenerator.__code_generation_prompt_template
        )
        code_generation_llm = ChatOpenAI(
            api_key=OPENAI_API_KEY,
            model="ft:gpt-4o-2024-08-06:parcs-lab:code-generation-v1:AlLIgcME",  # Adjust the model name as needed
            temperature=0  # Set the temperature to 0 for deterministic outputs
        )
        return LLMChain(llm=code_generation_llm, prompt=code_generation_prompt)

    # # Class variable to store the dummy code
    # _dummy = '''def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    # return activity_data.get('activity') == "Eating" and activity_data.get('status') == "end"'''

    @staticmethod
    def generate_code(summary_data, error_message=None):
        """
        Generate code based on the summary data.

        Args:
        - summary_data (dict): The transformed summary data.
        - error_message (str, optional): Error message from previous code validation.

        Returns:
        - str: The generated code.
        """
        # Include error message in the prompt if provided
        if error_message:
            prompt = f"""
            The previous code generated had the following error:
            {error_message}
            Please correct the code based on this error and the following summary data:
            {summary_data}
            """
        else:
            prompt = f"""
            Generate Python code based on the following summary data:
            {summary_data}
            """
        try:
            # Convert the reminder summary to JSON string format
            reminder_json = json.dumps(summary_data)
            
            # Get the code generation LLM chain
            chain = CodeGenerator.get_code_generation_chain()
            
            #return CodeGenerator._dummy #generated_code["text"]
            generated_code = chain.invoke({"reminder_json": reminder_json})
            
            # Extract and return the generated code from the result
            return generated_code["text"]
        
        except Exception as e:
            return f"Error generating code: {str(e)}"