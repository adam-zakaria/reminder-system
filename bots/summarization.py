# summarization.py

from langchain_openai import ChatOpenAI
from langchain.chains import LLMChain
from sujendraPromptTemplate import SujendraPromptTemplate
from datetime import datetime
import logging
import config
import json

# Define prompt template for Summarization LLM
summarization_prompt_template = """
You are tasked with summarizing a user’s reminder request in a structured format for code generation. The goal is to extract key details such as the task description, date, time, recurrence, and priority, and then output them in a consistent JSON format. The current date is {current_date}.

### JSON Structure Guidelines

The output should always be structured in the following JSON format:

{
  "task": "string",  # Data field definition remains
  "date": "string or null",
  "time": {
    "exact_time": {
      "start_time": "string or null",
      "end_time": "string or null"
    },
    "time_inferred": "string or null"
  },
  "recurrence": {
    "type": "string",
    "details": {
      "days": ["array of strings or null"],
      "occurrence_frequency": "string"
    }
  },
  "priority": "string"
}

### Field Guidelines:

#### 1. Task (string)
- **Description of the activity**: Extract the main task or activity from the user's reminder request (e.g., "Call John").

#### 2. Date (string or null)
- **Date or relative time**: Capture the provided date or relative reference (e.g., "tomorrow", "next Monday"). Do not convert relative dates into specific calendar dates.
- **Null if not provided**: If no specific date is mentioned, set to `null`.

#### 3. Time (object)
- **Exact Time (object)**: If the user mentions an exact time (e.g., "5 PM"), include it in the `"exact_time"` object:
  - `"start_time"`: The time the event starts.
  - `"end_time"`: If it’s not a time range, use the same value as `"start_time"`.
  - If no time is provided, set both `"start_time"` and `"end_time"` to `null`.
  - Example:
    {
      "exact_time": {
        "start_time": "5 PM",
        "end_time": "5 PM"
      }
    }

- **Inferred Time (string or null)**: If the user mentions a general period (e.g., "morning", "afternoon"), set `"time_inferred"` to the specific period:
  - If no general period is mentioned, set `"time_inferred"` to `null`.
  - Example:
    "time_inferred": "morning"

#### 4. Recurrence (object)
- **Type (string)**: Indicates the recurrence pattern of the event:
  - `"once"`: No repetition.
  - `"daily"`, `"weekly"`, `"monthly"`, `"yearly"`: For repeating events.
  - Example:
    "type": "weekly"

- **Details (object)**: Further details on recurrence:
  - `"days"` (array of strings or null): For weekly recurrences, specify the days (e.g., `["Monday", "Wednesday"]`). Set to `null` if not applicable.
  - `"occurrence_frequency"` (string): Defines how often it happens within a day.
    - `"once"`: Happens once during each recurrence.
    - `"multiple"`: Happens multiple times within the same day.
  - Example:
    "details": {
      "days": ["Monday", "Wednesday"],
      "occurrence_frequency": "multiple"
    }

#### 5. Priority (string)
- **Priority Level**: Include the priority if mentioned:
  - Possible values: `"high"`, `"medium"`, `"low"`.
  - **Default**: If unspecified, default to `"medium"`.

### Input and Expected JSON Output Examples:

#### **Example 1: Simple Reminder with Exact Time**  
- **Input**: "Remind me to call John at 5 PM tomorrow."
- **Output**:
  {
    "task": "Call John",
    "date": "tomorrow",
    "time": {
      "exact_time": {
        "start_time": "5 PM",
        "end_time": "5 PM"
      },
      "time_inferred": null
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

#### **Example 2: Reminder with Weekly Recurrence and Multiple Times**  
- **Input**: "Remind me to grab a snack every Monday and Wednesday at 9 AM, 12 PM, and 5 PM."
- **Output**:
  {
    "task": "Grab a snack",
    "date": null,
    "time": {
      "exact_time": null,
      "time_inferred": null
    },
    "recurrence": {
      "type": "weekly",
      "details": {
        "days": ["Monday", "Wednesday"],
        "occurrence_frequency": "multiple"
      }
    },
    "priority": "medium"
  }

#### **Example 3: Reminder with Inferred Time**  
- **Input**: "Remind me to have breakfast tomorrow morning."
- **Output**:
  {
    "task": "Have breakfast",
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

#### **Example 4: Jogging Reminder with Weekly Recurrence**  
- **Input**: "Remind me to go for a jog every Monday."
- **Output**:
  {
    "task": "Go for a jog",
    "date": null,
    "time": {
      "exact_time": {
        "start_time": null,
        "end_time": null
      },
      "time_inferred": null
    },
    "recurrence": {
      "type": "weekly",
      "details": {
        "days": ["Monday"],
        "occurrence_frequency": "once"
      }
    },
    "priority": "medium"
  }

### Instructions:
- **Output Format**: Always use the specified JSON structure.
- **Date Handling**: Use relative terms like "tomorrow" as provided. Do not convert these into specific calendar dates.
- **Time Handling**:
  - Use `"exact_time"` for specific times.
  - Use `"time_inferred"` for general periods like "morning".
  - If no time can be inferred, set both `"exact_time"` and `"time_inferred"` to `null`.
- **Recurrence Handling**:
  - Use `"recurrence"` to indicate how often an event repeats.
  - Use `"details"` to further describe the days and frequency within a recurrence period.
- **Priority Handling**: Defaults to `"medium"` if no priority is mentioned.

Conversation:
{conversation}
"""

# Define Summarization LLM function
def get_summarization_chain():
    # Create the custom prompt template using SujendraPromptTemplate
    summarization_prompt = SujendraPromptTemplate.from_json_template(
        template=summarization_prompt_template,  # Define your prompt template
        input_variables=["conversation", "current_date"]  # Define input variables
    )
    
    # Create the LLM using ChatOpenAI
    summarization_llm = ChatOpenAI(
        api_key=config.OPENAI_API_KEY,
        model="gpt-4o",  # Adjust the model name as needed
        temperature=0  # Set the temperature to 0 for deterministic outputs
    )

    # Create and return the RunnableSequence using the updated summarization model and prompt
    return summarization_prompt | summarization_llm

# Function to summarize a conversation
def summarize_conversation(conversation: str) -> dict:
    try:
        # Get the summarization chain
        chain = get_summarization_chain()

        # Get the current date
        current_date = datetime.now().strftime('%Y-%m-%d')

        # Log input data for debugging
        logging.info(f"Summarizing conversation on {current_date}: {conversation}")

        # Generate the summary using the invoke method
        result = chain.invoke({"conversation": conversation, "current_date": current_date})

        # Log the raw result for debugging
        logging.info(f"Raw result: {result}")

        # Access the `content` field of the AIMessage object
        if hasattr(result, "content"):
            content_str = result.content  # Retrieve the content field
            
            # Strip the backticks and 'json' marker and attempt to parse the JSON
            cleaned_content = content_str.strip('```json').strip()
            try:
                parsed_json = json.loads(cleaned_content)
                # Return the parsed JSON
                return {"content": parsed_json}
            except json.JSONDecodeError as e:
                logging.error(f"Failed to parse JSON content: {e}")
                return {"summary": {"error": "Invalid JSON format"}}
        
        # If 'content' does not exist in the result
        return {"summary": {"error": "No content in result"}}

    except Exception as e:
        # Handle any potential errors
        logging.error(f"Error during summarization: {e}")
        return {"error": str(e)}
