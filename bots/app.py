from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Optional, List
from fastapi.middleware.cors import CORSMiddleware
import uuid
import uvicorn
from chat_assistant import ChatAssistant  # Ensure relative import
from state_machine_executor import StateMachineExecutor
from loggers.activity_logging import activity_logger
from datetime import datetime
from util.scheduler import SchedulerService
from contextlib import asynccontextmanager
from threading import Thread

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
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
    sessionId: Optional[str] = None  # Optional for the first request
    userId: str

class ReminderRequest(BaseModel):
    reminder_json: Dict  # Expecting a dictionary for the reminder JSON

class UpdateData(BaseModel):
    activity: str
    house_id: str
    activity_status: str

class ActivityData(BaseModel):
    update: UpdateData

# Add new models
class TaskStatus(BaseModel):
    function_name: str
    date: str
    start_time: str
    end_time: Optional[str]
    start_timestamp: Optional[datetime]
    end_timestamp: Optional[datetime]
    recurrence: str
    status: str
    last_execution: Optional[datetime]
    next_execution: Optional[datetime]

class SchedulerResponse(BaseModel):
    total_tasks: int
    active_tasks: int 
    tasks: Dict[str, TaskStatus]

# Utility function to require user ID
def require_user_id(message: Message) -> Message:
    if not message.userId:
        raise HTTPException(status_code=400, detail="userId is required")
    return message

# API endpoint to handle the chat assistant conversation
@app.post("/chat/")
async def chat_with_assistant(message: Message = Depends(require_user_id)) -> Dict:
    try:
        if not message.sessionId:
            message.sessionId = str(uuid.uuid4())

        assistant_response, conversation_history, summarize_op, formatted_code, analysed_data = ChatAssistant.generate_assistant_response(
            message.sessionId, 
            message.message, 
            message.userId
        )

        # Handle error response from ChatAssistant
        if isinstance(assistant_response, str) and assistant_response.startswith("Error:"):
            raise HTTPException(status_code=500, detail=assistant_response)

        return {
            "sessionId": message.sessionId,
            "response": {"assistant": assistant_response},
            "conversation_history": conversation_history or [],
            "summarization": summarize_op,
            "code_output": formatted_code,
            "analysed_code_output": analysed_data,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# API endpoint to summarize conversation
# @app.post("/summarize/")
# async def summarize(message: Message) -> Dict:
#     try:
#         summarization_bot = SummarizationBot()
#         summary = summarization_bot.summarize_conversation(message.message)
#         return {"summary": summary}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# API endpoint to receive activity data
@app.post("/activity/")
async def receive_activity_data(activity_data: ActivityData, background_tasks: BackgroundTasks) -> Dict:
    try:
        # Log received activity data
        activity_logger.info(f"Received activity data: {activity_data}")

        # Access nested fields
        update_info = activity_data.update

        # Queue state machine execution in the background
        state_machine_executor = StateMachineExecutor()
        background_tasks.add_task(
            state_machine_executor.execute_all_state_machines,
            time=None,
            activity_data={"activity": update_info.activity, "status": update_info.activity_status},
            sensor_data=None,
        )

        # Return response immediately while background task continues
        return {"status": "success", "message": "Activity data processed and state machines execution queued"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/endpoint")
def read_endpoint():
    return {"message": "Hello, World!"}


@app.get("/scheduler/task/{task_id}")
async def get_task_status(task_id: str):
    """Get status of specific task"""
    try:
        scheduler = SchedulerService()
        status = scheduler.get_task_status(task_id)
        if not status["current"]:
            raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
        return status
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add endpoints
@app.get("/scheduler/status/", response_model=SchedulerResponse)
async def get_scheduler_status():
    """Get status of all scheduled tasks"""
    scheduler = SchedulerService()
    tasks = {}
    
    for task_id, task in scheduler._SchedulerService__task_registry.items():
        tasks[task_id] = TaskStatus(
            function_name=task.get("function_name"),
            date=task.get("date", "today"),
            start_time=task.get("start_time"),
            end_time=task.get("end_time"),
            start_timestamp=task.get("start_timestamp"),
            end_timestamp=task.get("end_timestamp"),
            recurrence=task.get("recurrence", "once"),
            status=task.get("status", "scheduled"),
            last_execution=task.get("last_run"),
            next_execution=task.get("next_run")
        )
    
    return SchedulerResponse(
        total_tasks=len(tasks),
        active_tasks=len([t for t in tasks.values() if t.status == "running"]),
        tasks=tasks
    )

@app.get("/api/scheduler/task/{task_id}", response_model=TaskStatus)
async def get_task_status(task_id: str):
    """Get status of specific task"""
    scheduler = SchedulerService()
    task = scheduler.get_task_status(task_id)
    
    if not task["current"]:
        raise HTTPException(status_code=404, detail="Task not found")
        
    return TaskStatus(
        function_name=task["current"]["function_name"],
        date=task["current"].get("date", "today"),
        start_time=task["current"]["start_time"],
        end_time=task["current"].get("end_time"),
        start_timestamp=task["current"].get("start_timestamp"),
        end_timestamp=task["current"].get("end_timestamp"),
        recurrence=task["current"].get("recurrence", "once"),
        status=task["current"]["status"],
        last_execution=task["current"].get("last_run"),
        next_execution=task["current"].get("next_run")
    )

@app.on_event("startup")
async def startup_event():
    scheduler = SchedulerService()
    scheduler.start()

@app.on_event("shutdown")
async def shutdown_event():
    scheduler = SchedulerService()
    scheduler.stop()

# Main execution block
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=4005)  # Set port to 8000 or any port you need
