from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Dict
from fastapi.middleware.cors import CORSMiddleware
from summarization import summarize_conversation
from chat_assistant import generate_assistant_response  # Updated function using LangChain
from code_generation import get_code_generation_chain
from state_machine_executor import execute_all_state_machines
import uuid
import uvicorn
from loggers.activity_logging import activity_logger


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # List of allowed origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Models to handle incoming API data
class Message(BaseModel):
    message: str
    sessionId: str = None  # Optional for the first request
    userId:str
    
# Define the ReminderRequest model
class ReminderRequest(BaseModel):
    reminder_json: Dict  # Expecting a dictionary for the reminder JSON

# Define nested model for update data
class UpdateData(BaseModel):
    activity: str
    house_id: str
    activity_status: str

# Define main model with nested update
class ActivityData(BaseModel):
    update: UpdateData
    
def require_user_id(message: Message):
    if not message.userId:
        raise HTTPException(status_code=400, detail="userId is required")
    return message

# API endpoint to handle the chat assistant conversation
@app.post("/chat/") 
async def chat_with_assistant(message: Message= Depends(require_user_id)):
    try:
        # If session_id is not provided, generate a new one (first interaction)
        if not message.sessionId:
            message.sessionId = str(uuid.uuid4())  # Generate a new unique session ID

        # Call the Chat Assistant LLM via LangChain to generate the assistant's response and updated conversation history
        assistant_response, updated_conversation_history, summarize_op, formatted_code, analysed_data = generate_assistant_response(message.sessionId, message.message, message.userId)

        # Return the session ID, assistant's response, and conversation history separately
        return {
            "sessionId": message.sessionId,
            "response": {"assistant": assistant_response},  # Only the assistant's response text
            "conversation_history": updated_conversation_history,  # Properly formatted JSON history
            "summarization" : summarize_op,
            "code_output" : formatted_code,
            "analysed_code_output": analysed_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/summarize/")
async def summarize(message: Message):
    try:
        summary = summarize_conversation(message.user_input)
        return {
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

# API endpoint for code generation
@app.post("/generate_code/")
async def generate_code(reminder_request: ReminderRequest):
    try:
        # Extract the reminder JSON from the request
        reminder_json = reminder_request.reminder_json
        
        # Call the code generation chain
        chain = get_code_generation_chain()

        # Invoke the chain with the input reminder_json and generate the code
        generated_code = chain.invoke({"reminder_json": reminder_json})

        # Return the generated code
        return {"generated_code": generated_code}

    except Exception as e:
        # Handle any exceptions and return HTTP 500 error with the exception message
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/activity/")
async def receive_activity_data(activity_data: ActivityData, background_tasks: BackgroundTasks):
    try:
        # Log received activity data
        activity_logger.info(f"Received activity data: {activity_data}")

        # Access nested fields
        update_info = activity_data.update
        #logging.info(f"Activity: {update_info.activity}, House ID: {update_info.house_id}, Status: {update_info.activity_status}")

        # Queue state machine execution in the background
        background_tasks.add_task(
            execute_all_state_machines,
            time=None,
            activity_data={"activity": update_info.activity, "status": update_info.activity_status},
            sensor_data=None
        )

        # Return response immediately while background task continues
        return {"status": "success", "message": "Activity data processed and state machines execution queued"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=4005)  # Set port to 8000 or any port you need
