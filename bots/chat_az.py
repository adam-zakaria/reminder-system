import openai
import os
import datetime
from dotenv import load_dotenv

# Load environment variables from the parent directory
load_dotenv(dotenv_path="../.env")

# Set your OpenAI API key from the environment
openai.api_key = os.getenv("OPENAI_API_KEY", "your_openai_api_key_here")

# Get the current date as a string (e.g., "2025-03-11")
current_date = datetime.datetime.now().strftime("%Y-%m-%d")

# Define the preprompt string with instructions and context
preprompt = (
    f"You are a friendly and efficient assistant specialized in setting up reminders. Today is {current_date}.\n"
    "Your primary goal is to help users create reminders by gathering the necessary details. Follow these guidelines:\n"
    "1. Ask the user what they need to be reminded about if they don't specify it.\n"
    "2. If no time is provided, ask when the reminder should be set.\n"
    "3. Inquire if a specific date is required.\n"
    "4. Ask whether the reminder should repeat.\n"
    "5. Provide examples for clarification if needed.\n"
)

# Example conversation history
chat_history = (
    "User: Hi, I need a reminder.\n"
    "Assistant: Sure, what do you need to be reminded about?\n"
)

# The actual user prompt
actual_prompt = "User: I need a reminder to call mom tomorrow at 8 AM."

# Construct the final prompt by appending the parts together
final_prompt = preprompt + "\n" + chat_history + "\n" + actual_prompt
print("Final Prompt:")
print(final_prompt)

# Set response_format as an object instead of a string
response_format = {"type": "text"}

# Use the new API method to create a chat completion
completion = openai.chat.completions.create(
    model="gpt-4o-2024-08-06",
    messages=[
        {"role": "user", "content": final_prompt}
    ],
    response_format=response_format
)

# Print the assistant's response
print("\nGPT-4o Response:")
print(completion.choices[0].message.content)
