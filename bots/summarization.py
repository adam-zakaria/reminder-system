# summarization.py

#from langchain_openai import ChatOpenAI
from langchain.chat_models import ChatOpenAI

from langchain.chains import LLMChain

from sujendraPromptTemplate import SujendraPromptTemplate
from datetime import datetime
import logging
import json
from config import OPENAI_API_KEY  # Adjusted import for config
import os
import json

class SummarizationBot:
    TIME_PERIODS_FILE = os.path.join("..", "Datastore", "time_periods.json")
    
    def __init__(self):
        self.time_periods = self._load_time_periods()
        self.dummy = """        {
            "task": "Do laundry",
            "date": null,
            "time": {
              "exact_time": {
                "start_time": "13:00",
                "end_time": "22:00"
              },
              "time_inferred": "after Dinner"
            },
            "recurrence": {
              "type": "once",
              "details": {
                "days": null,
                "occurrence_frequency": "once"
              }
            },
            "priority": "medium"
          }"""
          
        self.summarization_prompt_template = """
        You are tasked with summarizing a user's reminder request into a structured JSON format suitable for code generation. Extract key details such as the task description, date, time, recurrence, and priority, and output them in a consistent JSON structure. 

        ### Context:
          - **Current Date**: {current_date}
          - **Conversation History**: {conversation}
        **Key Requirements:**
        1. If a delay is mentioned in the user's request, it must be explicitly included in the **task** field as part of the task description. For example:
           - Input: "Remind me to wash the dishes in 10 minutes."
             Output: `"task": "Wash the dishes in 10 minutes"`
           - Input: "Take medicine 2 hours after breakfast."
             Output: `"task": "Take medicine 2 hours after breakfast"`
        2. If no delay is mentioned, the task should not include any reference to a delay. For example:
           - Input: "Remind me to clean the kitchen tomorrow."
             Output: `"task": "Clean the kitchen"`
        3. If no date is mentioned in the user's input, default the `"date"` field to `"today"`.

        **Your output must be only the JSON object following the exact structure and guidelines below. Do not include any explanations or extra text.**

        ---

        ### **JSON Output Structure**

        {
          "task": "string",
          "date": "string or null",
          "time": {
            "exact_time": {
              "start_time": "string or null",  // Time in 24-hour format "HH:MM"
              "end_time": "string or null"     // Time in 24-hour format "HH:MM"
            },
            "time_inferred": "string or null"
          },
          "recurrence": {
            "type": "string",
            "details": {
              "days": ["array of strings"] or null,
              "occurrence_frequency": "string"
            }
          },
          "priority": "string"
        }

        ---

        ### **Field Guidelines**

        #### **1. Task (`"task"`: string)**
        - Extract the main task or activity from the user's reminder request.
        - **Include delays explicitly in the task description when mentioned**. For example:
          - Input: "Wash the dishes in 10 minutes."
            Output: `"task": "Wash the dishes in 10 minutes"`
        - If no delay is mentioned, simply extract the task description:
          - Input: "Clean the kitchen tomorrow."
            Output: `"task": "Clean the kitchen"`

        #### **2. Date (`"date"`: string or null)**
        - **Include**: Provided dates or relative references (e.g., `"tomorrow"`, `"next Monday"`).
        - **Default to "today"**: If no date is explicitly mentioned, set `"date"` to `"today"`.
        - **Do Not Convert Relative Dates**: Do not translate relative dates like `"tomorrow"` into specific calendar dates.

        #### **3. Time (`"time"`: object)**

        - **Exact Time (`"exact_time"`: object)**
          - **Fill `"start_time"` and `"end_time"` whenever possible**, using standardized 24-hour format (`"HH:MM"`).
          - **Exact Times**:
            - Convert times like `"5 PM"` to `"17:00"`.
            - If it's not a time range, set `"end_time"` the same as `"start_time"`.
          - **Inferred Times**:
            - Map general periods or relative times to specific time ranges using the following mappings:
              {time_mappings}

            - Use these mappings to fill in `"start_time"` and `"end_time"` when times are inferred.
          - **No Time Provided**:
            - Set `"start_time"` and `"end_time"` to `null`.

        - **Time Inferred (`"time_inferred"`: string or null)**
          - **Include the general time expression** exactly as mentioned by the user (e.g., `"after dinner"`, `"morning"`).
          - **Null**: If no time is provided or cannot be inferred.

        #### **4. Recurrence (`"recurrence"`: object)**

        - **Type (`"type"`: string)**
          - Specify the recurrence pattern:
            - `"once"`: No repetition.
            - `"daily"`, `"weekly"`, `"monthly"`, `"yearly"`: For repeating events.

        - **Details (`"details"`: object)**
          - **Days (`"days"`: array of strings or null)**
            - For `"weekly"` recurrences, list days:
              - E.g., `["Monday", "Wednesday"]`
            - Set to `null` if not applicable.
          - **Occurrence Frequency (`"occurrence_frequency"`: string)**
            - `"once"`: Occurs once per recurrence.
            - `"multiple"`: Occurs multiple times per day.

        #### **5. Priority (`"priority"`: string)**
        - Specify if mentioned:
          - `"high"`, `"medium"`, `"low"`
        - Default to `"medium"` if not specified.

        ---

        ### **Instructions**
        - **Output Only the JSON**:
          - Do not include any additional text or explanations.
          - Ensure the JSON is properly formatted and valid.
        - **Time Format Standardization**:
          - Use 24-hour time format `"HH:MM"` for all times.
          - Convert times accordingly (e.g., `"5 PM"` to `"17:00"`).
        - **Date Handling**:
          - Use dates as provided.
          - Do not calculate or change relative dates.
        - **Time Handling**:
          - **Provide `"exact_time"` with `"start_time"` and `"end_time"`**, using mappings if necessary.
          - **Include `"time_inferred"`** with the general time expression as mentioned by the user.
          - If no time is provided, set both `"exact_time"` fields and `"time_inferred"` to `null`.
        - **Recurrence Handling**:
          - Accurately represent recurrence information.
          - Use `"details"` to specify days and frequency.
        - **Priority Handling**:
          - Include if specified; otherwise, default to `"medium"`.
        ---

        ### **Examples**

        #### **Example: Reminder with Delay Included in Task**

        - **Input**:  
          "Remind me to wash my dishes in 10 minutes."

        - **Output**:

          {
            "task": "Wash my dishes in 10 minutes",
            "date": "today",
            "time": {
              "exact_time": {
                "start_time": null,
                "end_time": null
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

        #### **Example: Reminder with No Delay**

        - **Input**:  
          "Remind me to clean the kitchen tomorrow."

        - **Output**:

          {
            "task": "Clean the kitchen",
            "date": "tomorrow",
            "time": {
              "exact_time": {
                "start_time": null,
                "end_time": null
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

        #### **Example: Reminder with No Date Mentioned**

        - **Input**:  
          "Remind me to water the plants."

        - **Output**:

          {
            "task": "Water the plants",
            "date": "today",
            "time": {
              "exact_time": {
                "start_time": null,
                "end_time": null
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

        **Remember**:
        - **Include `time_inferred`**: Fill this field with the general time expression provided by the user when applicable.
        - **Default to Today if No Date Provided**: Use `"today"` as the value for `"date"` when no specific date is mentioned.
        - **Consistency is Key**: Always adhere to the specified JSON structure and field guidelines.
        - **Standardize Time Formats**: Use 24-hour `"HH:MM"` format for all times.
        - **Focus on the Task**: Extract information accurately without adding or omitting details.
        - **No Additional Text**: Provide only the JSON output.
        """
        
        self.chain = self.get_summarization_chain()

    def _load_time_periods(self):
        with open(self.TIME_PERIODS_FILE, 'r') as f:
            return json.load(f)
            
    def get_time_period(self, period_type, period_name):
        return self.time_periods.get(period_type, {}).get(period_name, {})


    def get_summarization_chain(self):
        summarization_prompt = SujendraPromptTemplate.from_json_template(
            template=self.summarization_prompt_template,
            input_variables=["conversation", "current_date", "time_mappings"]
        )
        summarization_llm = ChatOpenAI(
            api_key=OPENAI_API_KEY,
            model="gpt-4o",
            temperature=0
        )
        return summarization_prompt | summarization_llm

    def summarize_conversation(self, conversation: str) -> dict:
        try:
            current_date = datetime.now().strftime('%Y-%m-%d')
            logging.info(f"Summarizing conversation on {current_date}: {conversation}")
            result = self.chain.invoke({"conversation": conversation, "current_date": current_date, "time_mappings": json.dumps(self.time_periods, indent=2)})
            logging.info(f"Raw result: {result}")

            if hasattr(result, "content"):
                content_str = result.content
                cleaned_content = content_str.strip('```json').strip()
                try:
                    parsed_json = json.loads(cleaned_content)
                    return {"content": parsed_json}
                except json.JSONDecodeError as e:
                    logging.error(f"Failed to parse JSON content: {e}")
                    return {"summary": {"error": "Invalid JSON format"}}
            return {"summary": {"error": "No content in result"}}
        except Exception as e:
            logging.error(f"Error during summarization: {e}")
            return {"error": str(e)}
    
    
    
if __name__ == "__main__":    
    # Create instance of SummarizationBot
    bot = SummarizationBot()
    
    # Test conversation
    conversation = "Remind to do laundry after breakfast"
    
    # Call summarize_conversation method
    result = bot.summarize_conversation(conversation)
    
    # Print result
    print("Summarization Result:")
    print(json.dumps(result, indent=2))

# Example usage
# if __name__ == "__main__":
#     bot = SummarizationBot()
#     conversation = "Remind me to wash the dishes in 10 minutes."
#     summary = bot.summarize_conversation(conversation)
#     print(summary)
