#from langchain_openai import ChatOpenAI
from langchain.chat_models import ChatOpenAI

from langchain.prompts import PromptTemplate
from sujendraPromptTemplate import SujendraPromptTemplate
from langchain.chains import LLMChain
from summarization import SummarizationBot
from code_generation import CodeGenerator
from code_analyser import analyse_code  # Updated import for CodeAnalyser
from datetime import datetime
from config import OPENAI_API_KEY  # Adjusted import for config
from util.excel_helper import update_session_data
from state_machine_executor import StateMachineExecutor
from threading import Lock
import os
import json
import uuid
from typing import Dict, Any, ClassVar, List

class ChatAssistant:
    STATE_MACHINE_FILE = os.path.join("..", "Datastore", "state_machines.json")
    SENSOR_MAPPING_FILE = os.path.join("..", "Datastore", "sensor_mapping.json")
    ACTIVITIES_FILE = os.path.join("..", "Datastore", "activities.json")
    _instance = None
    _lock = Lock()
    conversation_store: ClassVar[Dict[str, List[dict]]] = {}
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls.conversation_store = {}
        return cls._instance
    
    def __init__(self):
        if hasattr(self, '_initialized'):
            return
        self._initialized = True
        self.conversation_store: Dict[str, Any] = {}  # Initialize empty dictionary
        self.current_date = datetime.now().strftime("%Y-%m-%d")
        self.sensors = self._load_sensors()
        self.activities = self._load_activities()
        self._chat_prompt_template = self._create_prompt_template()

        
    def _load_sensors(self):
        with open(self.SENSOR_MAPPING_FILE, 'r') as f:
            return json.load(f)
            
    def _load_activities(self):
        with open(self.ACTIVITIES_FILE, 'r') as f:
            data = json.load(f)
            return data["activities"]
        
    def _format_sensors_text(self):
        """Format sensor IDs into bullet points for prompt."""
        return '\n'.join([f'    - {sensor_id}' for sensor_id in self.sensors.values()])

    def _format_activities_text(self):
        """Format activities list for prompt."""
        return f"{list(self.activities.keys())}"
    
    # Define prompt template for Chat Assistant LLM using conversation history
    def _create_prompt_template(self):
        return """
    You are a friendly and efficient assistant specialized in setting up reminders. Your primary goal is to help users create reminders by gathering the necessary details. Follow these guidelines to assist users effectively:

    1. **Task**: Ask the user what they need to be reminded about if they don't specify it. Examples include: household tasks (e.g., "watering the plants," "taking out the trash," "cleaning the kitchen") or any other personal tasks or events.
     
    2. **Time/Event**: If the user hasn't provided a specific time or event for the reminder, ask them to clarify. For example:
       - "When should I remind you?" (e.g., "Remind me at 7:00 PM" or "Remind me when I start cooking")
       - You may suggest time-based or event-based reminders (e.g., "when I wake up," "when I come home," "before dinner").

    3. **Date (Optional)**: If no date is given, ask if they would like to specify a date, or leave it as an open-ended reminder. Examples you can offer include:
       - "Would you like the reminder for today, tomorrow, or a specific date?"

    4. **Recurrence**: If the user hasn't mentioned recurrence, ask whether they would like the reminder to repeat and how often. Provide examples like:
       - "Do you want this reminder to repeat every day, weekly, or just once?"

    5. **Event-based Reminders**: If the reminder is tied to an event (e.g., "when I come home," "when I wake up"), ask whether they should be reminded once or multiple times. Examples:
       - "Would you like to be reminded once, or several times leading up to the event?"

    6. **Clarification & Examples**: If the user is unsure or unclear, politely provide examples to help them understand. For instance:
       - "If you're not sure when to set the reminder, you could say 'Remind me every morning when I wake up' or 'Remind me once at 7:00 PM.'"

    7. **Respond Dynamically**: Only ask follow-up questions if certain information is missing (such as time, recurrence, or task details). If the user provides complete information in their initial message, proceed to confirm and set up the reminder without asking unnecessary questions.

    8. **Polite Limitations**: Politely inform the user if they request anything beyond setting up reminders, saying:
       - "I specialize in creating reminders, but I'm happy to help with that! Let me know what you need to be reminded about."

    9. **Chat Ended**: Once the user has provided all the necessary information (task, time/event, and recurrence, if applicable) and the reminder is successfully set, conclude the conversation with `[ChatEnded]`.
       
    Be clear, polite, and concise in all interactions, and ensure that the user's requests are fully understood before setting up the reminder.

    Conversation so far:
    "{conversation_history}"
    """

    @staticmethod
    def transform_summary_for_code_generation(summary):
        """
        Transforms the summarization output into the necessary format for code generation.
        """
        print(summary, "summary")
        try:
            # Extract necessary fields
            transformed_data = {
                "task": summary.get("task", ""),
                "time_inferred": summary.get("time", {}).get("time_inferred", None),
                "recurrence": summary.get("recurrence", {}),
                "priority": summary.get("priority", "low")  # Default to low if priority is missing
            }
            
            # Return the structured data
            return transformed_data
        except Exception as e:
            print(f"Error in transforming summary: {str(e)}")
            return {}

    @classmethod
    def get_chat_assistant_chain(cls) -> LLMChain:
        """
        Create the PromptTemplate with conversation history and return the LLMChain.
        """
        instance = cls()
        prompt_template = PromptTemplate(
            input_variables=["current_date", "conversation_history", "available_sensors", "available_activities"],
            template=instance._chat_prompt_template
        )
        chat_llm = ChatOpenAI(model="gpt-4o", api_key=OPENAI_API_KEY, temperature=0)

        # Debug: Print raw template
        print("\n=== Raw Template ===")
        print(prompt_template.template)

        # Debug: Print sample formatted template
        sample_vars = {
            "current_date": "2025-01-02",
            "conversation_history": "User: Hello\nAssistant: Hi",
            "available_sensors": "microwave_smart_cable",
            "available_activities": "Meal_Preparation"
        }
        formatted_prompt = prompt_template.format(**sample_vars)
        print("\n=== Formatted Template ===")
        print(formatted_prompt)

        return LLMChain(llm=chat_llm, prompt=prompt_template)

    @staticmethod
    def convert_sensors_to_dict(sensors_list):
        """Convert a list of sensors into a dictionary for efficient lookup."""
        return {sensor: True for sensor in sensors_list}

    @staticmethod
    def format_conversation_history(conversation_history: List[dict]) -> str:
        if not conversation_history:
            return "No previous conversation"
        
        formatted = []
        for msg in conversation_history:
            role = msg['role'].capitalize()
            content = msg['content'].strip()
            formatted.append(f"{role}: {content}")
        
        return "\n".join(formatted)

    @staticmethod
    def format_code_for_frontend(raw_code: str, language: str = "python") -> dict:
        """
        Formats code for frontend display by escaping special characters.
        Args:
        - raw_code (str): The raw code to be formatted.
        - language (str): The language of the code (default: 'python').

        Returns:
        - dict: A dictionary containing the formatted code and language metadata.
        """
        # Escape special characters for JSON compatibility
        escaped_code = raw_code.replace("\\", "\\\\").replace("\n", "\\n").replace('"', '\\"').replace("```python", "").replace("```", "")

        # Structure the response
        formatted_code = {
            "language": language,
            "code": escaped_code
        }

        return formatted_code

    @classmethod
    def generate_assistant_response(cls, session_id: str, user_input: str, user_id: str) -> tuple[str, list, dict, str, dict]:
        instance = cls()
        summarization = None
        formatted_code = None
        analysed_data = None
        state_machine_executor = StateMachineExecutor()
        MAX_RETRIES = 3
        
        try:
            if session_id not in cls.conversation_store:
                cls.conversation_store[session_id] = []
                
            cls.conversation_store[session_id].append({
                "role": "user", 
                "content": user_input
            })

            formatted_history = cls.format_conversation_history(cls.conversation_store[session_id])
            chat_chain = cls.get_chat_assistant_chain()
            
            prompt_variables = {
                "current_date": instance.current_date,
                "conversation_history": formatted_history,
                "available_sensors": instance._format_sensors_text(),
                "available_activities": instance._format_activities_text()
            }
            
            print(formatted_history)
            response = chat_chain.invoke(prompt_variables)
            
            assistant_response = response["text"]
            cls.conversation_store[session_id].append({
                "role": "assistant",
                "content": assistant_response
            })

            conversation_str = "\n".join(
                f"{msg['role']}: {msg['content']}" 
                for msg in cls.conversation_store[session_id]
            )
            update_session_data(session_id, conversation=conversation_str)

            if "[ChatEnded]" in assistant_response:
                formatted_conv = cls.format_conversation_history(cls.conversation_store[session_id])
                summarization_bot = SummarizationBot()
                summarization = summarization_bot.summarize_conversation(formatted_conv)
                update_session_data(session_id, summarization=summarization)

                transformed_summary = cls.transform_summary_for_code_generation(summarization["content"])
                code_output = CodeGenerator.generate_code(transformed_summary)
                function_name = state_machine_executor.generate_valid_function_name()

                for retry in range(MAX_RETRIES):
                    try:
                        cleaned_code = state_machine_executor.clean_generated_code(code_output)
                        renamed_code = state_machine_executor.rename_function_in_code(
                            cleaned_code, 
                            function_name
                        )
                        
                        if state_machine_executor.validate_code(renamed_code):
                            formatted_code = cls.format_code_for_frontend(renamed_code)
                            analysed_data = analyse_code(renamed_code)
                            
                            if "sensors" in analysed_data:
                                analysed_data["sensors"] = cls.convert_sensors_to_dict(
                                    analysed_data["sensors"]
                                )

                            state_machine_executor.save_state_machine_to_json(
                                session_id,
                                user_id, 
                                summarization,
                                renamed_code,
                                analysed_data
                            )
                            update_session_data(session_id, code_generation=renamed_code)
                            break
                        
                    except Exception as e:
                        print(f"Retry {retry + 1} failed: {str(e)}")
                        if retry == MAX_RETRIES - 1:
                            raise ValueError(f"Code validation failed after {MAX_RETRIES} attempts")

            return (
                assistant_response,
                cls.conversation_store[session_id],
                summarization,
                formatted_code,
                analysed_data
            )

        except Exception as e:
            print(f"Error in generate_assistant_response: {str(e)}")
            return str(e), [], None, None, None
# Usage example
assistant = ChatAssistant()
print(assistant.conversation_store)  # Should print empty dict {}
# response = assistant.generate_assistant_response(session_id, user_input, userId)