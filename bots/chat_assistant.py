from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain
from summarization import summarize_conversation
from code_generation import generate_code
from code_analyser import analyse_code
from datetime import datetime
import config
from util.excel_helper import update_session_data
from state_machine_executor import save_state_machine_to_json
import os
import json
import uuid

# In-memory storage for conversation histories by session ID
conversation_store = {}

STATE_MACHINE_FILE = os.path.join("..", "Datastore", "state_machines.json")

# Define prompt template for Chat Assistant LLM using conversation history
chat_prompt_template = """
You are a friendly and efficient assistant specialized in setting up reminders. Your primary goal is to help users create reminders by gathering the necessary details. Follow these guidelines to assist users effectively:

1. **Task**: Ask the user what they need to be reminded about if they don’t specify it. Examples include: household tasks (e.g., "watering the plants," "taking out the trash," "cleaning the kitchen") or any other personal tasks or events.

2. **Time/Event**: If the user hasn't provided a specific time or event for the reminder, ask them to clarify. For example:
   - "When should I remind you?" (e.g., "Remind me at 7:00 PM" or "Remind me when I start cooking")
   - You may suggest time-based or event-based reminders (e.g., "when I wake up," "when I come home," "before dinner").

3. **Date (Optional)**: If no date is given, ask if they would like to specify a date, or leave it as an open-ended reminder. Examples you can offer include:
   - "Would you like the reminder for today, tomorrow, or a specific date?"

4. **Recurrence**: If the user hasn’t mentioned recurrence, ask whether they would like the reminder to repeat and how often. Provide examples like:
   - "Do you want this reminder to repeat every day, weekly, or just once?"

5. **Event-based Reminders**: If the reminder is tied to an event (e.g., "when I come home," "when I wake up"), ask whether they should be reminded once or multiple times. Examples:
   - "Would you like to be reminded once, or several times leading up to the event?"

6. **Clarification & Examples**: If the user is unsure or unclear, politely provide examples to help them understand. For instance:
   - "If you're not sure when to set the reminder, you could say 'Remind me every morning when I wake up' or 'Remind me once at 7:00 PM.'"

7. **Respond Dynamically**: Only ask follow-up questions if certain information is missing (such as time, recurrence, or task details). If the user provides complete information in their initial message, proceed to confirm and set up the reminder without asking unnecessary questions.

8. **Polite Limitations**: Politely inform the user if they request anything beyond setting up reminders, saying:
   - "I specialize in creating reminders, but I'm happy to help with that! Let me know what you need to be reminded about."

9. **Chat Ended**: Once the user has provided all the necessary information (task, time/event, and recurrence, if applicable) and the reminder is successfully set, conclude the conversation with `[ChatEnded]`.
   
Be clear, polite, and concise in all interactions, and ensure that the user’s requests are fully understood before setting up the reminder.

Conversation so far:
{conversation_history}
"""
current_date = datetime.now().strftime("%Y-%m-%d")  # Format the current date

# Create the PromptTemplate with conversation history
def get_chat_assistant_chain():
    prompt_template = PromptTemplate(
        input_variables=["conversation_history"],
        template=chat_prompt_template
    )
    
    # Use ChatOpenAI with LangChain to manage the LLM chain
    chat_llm = ChatOpenAI(model="gpt-4o", api_key=config.OPENAI_API_KEY, temperature=0)

    # Create an LLMChain with the template and LLM
    return LLMChain(llm=chat_llm, prompt=prompt_template)

def convert_sensors_to_dict(sensors_list):
    """Convert a list of sensors into a dictionary for efficient lookup."""
    return {sensor: True for sensor in sensors_list}

# Function to format conversation history for the prompt
def format_conversation_history(conversation_history):
    print(conversation_history, "conversation history" )
    return "\n".join(
        [f"{msg['role'].capitalize()}: {msg['content']}" for msg in conversation_history]
    )
    
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
    escaped_code = raw_code.replace("\\", "\\\\").replace("\n", "\\n").replace('"', '\\"').replace("```python","").replace("```","")

    # Structure the response
    formatted_code = {
        "language": language,
        "code": escaped_code
    }

    return formatted_code

# def save_state_machine_to_json(session_id, user_id, conversation_summary, generated_code):
#     try:
#         # Ensure the directory exists
#         os.makedirs(os.path.dirname(STATE_MACHINE_FILE), exist_ok=True)

#         # Check if the file exists and is non-empty before loading
#         if os.path.exists(STATE_MACHINE_FILE) and os.path.getsize(STATE_MACHINE_FILE) > 0:
#             with open(STATE_MACHINE_FILE, 'r') as file:
#                 try:
#                     state_machines = json.load(file)
#                 except json.JSONDecodeError:
#                     # Handle corrupted JSON by resetting to an empty dictionary
#                     print("Warning: JSON file corrupted. Resetting to empty dictionary.")
#                     state_machines = {}
#         else:
#             # Initialize with an empty dictionary if file does not exist or is empty
#             state_machines = {}

#         # Generate a unique state machine ID for this entry
#         state_machine_id = str(uuid.uuid4())
        
#         # Create a state machine entry
#         state_machine_entry = {
#             "stateMachineId": state_machine_id,
#             "date": datetime.now().strftime("%Y-%m-%d"),
#             "conversation_summary": conversation_summary,
#             "generated_code": generated_code
#         }

#         # Append the state machine to the session entry for the user in the JSON
#         if session_id not in state_machines:
#             state_machines[session_id] = {
#                 "userId": user_id,
#                 "state_machines": []  # Initialize a list for multiple state machines
#             }

#         # Append new state machine to the session's list
#         state_machines[session_id]["state_machines"].append(state_machine_entry)

#         # Write the updated data back to the JSON file
#         with open(STATE_MACHINE_FILE, 'w') as file:
#             json.dump(state_machines, file, indent=2)
#         print(f"State machine {state_machine_id} saved successfully.")
#     except Exception as e:
#         print(f"Error saving state machine to JSON: {str(e)}")
        
         
# Function to manage conversation history and generate assistant response
def generate_assistant_response(session_id, user_input, userId):
    summarization = None
    formatted_code = None
    analysed_data = None
    try:
        # Retrieve or initialize conversation history for the session
        if session_id not in conversation_store:
            conversation_store[session_id] = []

        # Append user's input to the conversation history
        conversation_store[session_id].append({
            "role": "user",
            "content": user_input
        })

        # Format the conversation history for the assistant's prompt
        formatted_history = format_conversation_history(conversation_store[session_id])
        chat_chain = get_chat_assistant_chain()
        assistant_response = chat_chain.invoke({"conversation_history": formatted_history})
        
        # Append assistant's response to the conversation history
        conversation_store[session_id].append({
            "role": "assistant",
            "content": assistant_response["text"]
        })
        
        # Update the conversation history in Excel
        conversation_str = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation_store[session_id]])
        update_session_data(session_id, conversation=conversation_str)

        # Check if the response contains '[ChatEnded]'
        if "[ChatEnded]" in assistant_response["text"]:
            formatted_conversation = format_conversation_history(conversation_store[session_id])
            summarization = summarize_conversation(formatted_conversation)
            update_session_data(session_id, summarization=summarization)

            # Generate code based on summarization
            code_output = generate_code(summarization["content"])
            formatted_code = format_code_for_frontend(code_output)
            
            # Analyse the generated code
            analysed_data = analyse_code({"function_code": code_output})

            # Convert sensors list to a dictionary for efficient lookup using the helper function
            if "sensors" in analysed_data:
                analysed_data["sensors"] = convert_sensors_to_dict(analysed_data["sensors"])

            # Save state machine details to JSON with analysis
            save_state_machine_to_json(session_id, userId, summarization, code_output, analysed_data)

            # Update code generation result in Excel
            update_session_data(session_id, code_generation=code_output)
            
            print(analysed_data)

        return assistant_response["text"], conversation_store[session_id], summarization, formatted_code, analysed_data

    except Exception as e:
        print(f"Error: {str(e)}")
        return f"Error: {str(e)}", []