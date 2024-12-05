from langchain_openai import ChatOpenAI
from sujendraPromptTemplate import SujendraPromptTemplate
from langchain.chains import LLMChain
import config  # Ensure config.py contains OPENAI_API_KEY
import json

# Define prompt template for Code Analysis LLM
code_analysis_prompt_template = """
You are tasked with analyzing a Python function to identify specific sensors and activities used within a state machine setup. I need you to output only the following elements, in JSON format, so I can filter state machines based on their sensor and activity usage.

1. **Sensors**: List each sensor name directly referenced in the function.
2. **Activities**: Identify any activity types and statuses referenced in the function.

Please avoid any additional explanations, interpretations, or assumptions. Only output the sensor names and activity types exactly as they appear in the code.

Format your response precisely in the following JSON structure:

{
    "sensors": [
        "microwave_smart_cable", "kitchen_motion_sensor", "fridge_entry_sensor", "microwave_door_entry_sensor"
    ],
    "activities": [
        {
            "activity_type": "Meal_Preparation",
            "status": "start"
        }
    ]
}

**Function Code to Analyze:**

```python
{function_code}
```
"""

# Define Code Analyser LLM function
def get_code_analyser_chain():
    code_analyser_prompt = SujendraPromptTemplate.from_json_template(
        input_variables=["function_code"],
        template=code_analysis_prompt_template
    )
    code_analyser_llm = ChatOpenAI(
        api_key=config.OPENAI_API_KEY,
        model="gpt-4o",  # Adjust the model name as needed
        temperature=0  # Set the temperature to 0 for deterministic outputs
    )
    return LLMChain(llm=code_analyser_llm, prompt=code_analyser_prompt)

def analyse_code(function_code):
    try:
        print(function_code, "function")
        chain = get_code_analyser_chain()
        
        print("inside analyse code")
        # Invoke the chain with the function code to analyze
        analysed_output = chain.invoke({"function_code": function_code})
        
        # Check if the response is empty or lacks "text"
        if not analysed_output or "text" not in analysed_output or not analysed_output["text"].strip():
            print("Error: Empty or invalid response from code analysis.")
            return {"error": "Empty or invalid response from code analysis"}
        
        # Clean up backticks or markdown formatting in the response
        clean_text = analysed_output["text"].strip().replace("```json", "").replace("```", "")
        
        print("Cleaned output:", clean_text)
        
        # Parse and return the output as a dictionary
        parsed_output = json.loads(clean_text)
        return parsed_output

    except json.JSONDecodeError as json_error:
        print(f"JSON parsing error: {json_error}")
        print("Raw output that caused error:", analysed_output.get("text", "No 'text' key found"))
        return {"error": "Invalid JSON format in code analysis output"}
    except Exception as e:
        print(f"General error analyzing code: {str(e)}")
        return {"error": str(e)}
