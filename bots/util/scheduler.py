import schedule
import time
import threading
from datetime import datetime, timedelta, date
from threading import Thread, Timer
import logging
from typing import Callable, List, Optional
import uuid
import json
import os

# Configure logging
logging.basicConfig(level=logging.INFO)  # Fixed typo from 'levelg' to 'level'
logger = logging.getLogger(__name__)

class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder for datetime objects"""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)
    
class SchedulerService:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls, scheduler_file=None):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance.initialized = False
            return cls._instance
    
    def __init__(self, scheduler_file=None):
        with self._lock:
            if not self.initialized:
                self.running = False
                self.scheduler_thread = None
                if scheduler_file:
                    self.__scheduler_file = scheduler_file
                else:
                    self.__scheduler_file = os.path.join("Datastore", "scheduler.json")
                self.__task_registry = self.__load_tasks()
                self.__execution_counts = {}
                self.__task_history = {}
                self.initialized = True

    def start(self):
        """Start the scheduler thread if not already running"""
        with self._lock:
            if not self.running:
                self.running = True
                if not self.scheduler_thread or not self.scheduler_thread.is_alive():
                    self.scheduler_thread = Thread(target=self.run_scheduler, daemon=True)
                    self.scheduler_thread.start()
                    logger.info("Scheduler thread started")

    def stop(self):
        """Stop the scheduler thread"""
        with self._lock:
            if self.running and self.scheduler_thread and self.scheduler_thread.is_alive():
                self.running = False
                self.scheduler_thread.join()
                self.scheduler_thread = None
                logger.info("Scheduler thread stopped")

    def __del__(self):
        """Cleanup on deletion"""
        self.stop()

    def run_scheduler(self) -> None:
        """Run the scheduler in a separate thread."""
        while self.running:
            schedule.run_pending()
            time.sleep(1)

    def track_task_execution(self, task_id: str, status: str, message: str = None) -> None:
        """Track task execution status and history"""
        if task_id in self.__task_registry:
            timestamp = datetime.now()
            
            # Update task status
            self.__task_registry[task_id].update({
                "status": status,
                "last_updated": timestamp,
                "message": message
            })
            
            # Record execution history
            if task_id not in self.__task_history:
                self.__task_history[task_id] = []
            
            self.__task_history[task_id].append({
                "timestamp": timestamp,
                "status": status,
                "message": message
            })

    def execute_task(self, task_id: str, function_name: str, args=None) -> None:
        logger.info(f"Executing task: {task_id}")
        logger.info(f"Registry state: {self.__task_registry}")
        try:
            task_info = self.__task_registry.get(task_id)
            if not task_info:
                return

            recurrence = task_info.get("recurrence")
            occurrence = task_info.get("occurrence")
            
            # Handle different recurrence patterns
            if recurrence == "once" and occurrence == "once":
                if self.__execution_counts.get(task_id, 0) >= 1:
                    logger.info(f"One-time task {task_id} already executed")
                    task_info["status"] = "completed"
                    return
            
            elif recurrence in ["daily", "weekly", "monthly", "yearly"]:
                if occurrence == "once":
                    # Check if already executed today
                    last_run = task_info.get("last_run")
                    if last_run and last_run.date() == datetime.now().date():
                        logger.info(f"Task {task_id} already executed today")
                        return
                # For multiple occurrences, always execute within time window
            
            # Update execution tracking
            self.__execution_counts[task_id] = self.__execution_counts.get(task_id, 0) + 1
            task_info["last_run"] = datetime.now()
            task_info["status"] = "running"

            # Execute function
            if function_name == "activate_state_machine":
                self.__state_machine_executor.activate_state_machine(*args if args else [])
            elif function_name == "deactivate_state_machine":
                self.__state_machine_executor.deactivate_state_machine(*args if args else [])

            # Update status after execution
            task_info["status"] = "completed" if recurrence == "once" else "scheduled"

            # Save state after execution
            self.__save_tasks()

        except Exception as e:
            logger.error(f"Error executing task {task_id}: {str(e)}")
            if task_info:
                task_info["status"] = "failed"
                self.__save_tasks()

    def get_task_status(self, task_id: str) -> dict:
        """Get task status and history"""
        return {
            "current": self.__task_registry.get(task_id, {}),
            "history": self.__task_history.get(task_id, []),
            "executions": self.__execution_counts.get(task_id, 0)
        }

    def cleanup_completed_tasks(self) -> None:
        """Remove completed one-time tasks"""
        for task_id in list(self.__task_registry.keys()):
            task = self.__task_registry[task_id]
            if (task["occurrence"] == "once" and 
                task["status"] == "completed"):
                del self.__task_registry[task_id]

    def add_task(self, date: str, start_time: str, end_time: Optional[str], 
                 recurrence_type: str, function_name: str, occurrence: str = 'once',
                 days: Optional[List[str]] = None, args: Optional[List] = None) -> str:
        task_id = str(uuid.uuid4())
        
        # Parse date and times
        target_date = self.parse_date(date)
        start_timestamp = datetime.combine(target_date, datetime.strptime(start_time, "%H:%M").time())
        end_timestamp = None
        if end_time:
            end_timestamp = datetime.combine(target_date, datetime.strptime(end_time, "%H:%M").time())

        # Create task entry
        task_info = {
            "function_name": function_name,
            "date": date,
            "start_time": start_time,
            "end_time": end_time,
            "recurrence": recurrence_type,
            "occurrence": occurrence,
            "args": args,
            "days": days,
            "status": "scheduled",
            "last_run": None,
            "next_run": start_timestamp
        }
        
        # Add to registry and save
        self.__task_registry[task_id] = task_info
        self.__save_tasks()
        
        # Schedule task
        if recurrence_type == "once":
            schedule.every().day.at(start_time).do(
                lambda: self.execute_task(task_id, function_name, args)
            ).tag(task_id)
        
        logger.info(f"Task {task_id} scheduled for {start_timestamp}")
        return task_id

    @staticmethod
    def parse_date(date_str: str) -> date:
        """Parse the date string into a date object."""
        if date_str.lower() == 'today':
            return datetime.now().date()
        elif date_str.lower() == 'tomorrow':
            return (datetime.now() + timedelta(days=1)).date()
        try:
            return datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError(f"Invalid date format: {date_str}")

    def parse_time_window(self, target_date: date, start_time: str, end_time: Optional[str] = None) -> tuple:
        """Parse time window and return start/end timestamps"""
        start_time_obj = datetime.strptime(start_time, "%H:%M").time()
        start_timestamp = datetime.combine(target_date, start_time_obj)
        
        end_timestamp = None
        if end_time:
            end_time_obj = datetime.strptime(end_time, "%H:%M").time()
            end_timestamp = datetime.combine(target_date, end_time_obj)
        
        return start_timestamp, end_timestamp

    def schedule_once(self, start_datetime: datetime, end_datetime: datetime, execute_task: Callable) -> None:
        """Schedule a one-time task."""
        delay = (start_datetime - datetime.now()).total_seconds()
        if delay >= 0:
            Timer(delay, self.execute_within_time_range, args=(start_datetime, end_datetime, execute_task)).start()
            logger.info(f"One-time task scheduled for {start_datetime.isoformat()}")
        else:
            logger.warning("The specified start time has already passed.")

    def schedule_daily(self, start_time: str, execute_task: Callable) -> None:
        """Schedule a daily task."""
        schedule.every().day.at(start_time).do(execute_task)
        logger.info(f"Daily task scheduled at {start_time}")

    def schedule_weekly(self, start_time: str, days: List[str], execute_task: Callable) -> None:
        """Schedule a weekly task on specified days."""
        for day in days:
            getattr(schedule.every(), day.lower()).at(start_time).do(execute_task)
        logger.info(f"Weekly task scheduled at {start_time} on {', '.join(days)}")

    def schedule_monthly(self, target_day: int, start_time: str, execute_task: Callable) -> None:
        """Schedule a monthly task."""
        next_date = self.get_next_monthly_date(target_day, start_time)
        delay = (next_date - datetime.now()).total_seconds()
        Timer(delay, execute_task).start()
        logger.info(f"Monthly task scheduled for {next_date.isoformat()}")

    def schedule_yearly(self, target_month: int, target_day: int, start_time: str, execute_task: Callable) -> None:
        """Schedule a yearly task."""
        next_date = self.get_next_yearly_date(target_month, target_day, start_time)
        delay = (next_date - datetime.now()).total_seconds()
        Timer(delay, execute_task).start()
        logger.info(f"Yearly task scheduled for {next_date.isoformat()}")

    def execute_within_time_range(self, start_datetime: datetime, end_datetime: datetime, execute_task: Callable) -> None:
        """Execute the task within the specified time range."""
        current_datetime = datetime.now()
        if start_datetime <= current_datetime <= end_datetime:
            execute_task()
        elif current_datetime < start_datetime:
            delay = (start_datetime - current_datetime).total_seconds()
            Timer(delay, self.execute_within_time_range, args=(start_datetime, end_datetime, execute_task)).start()
        else:
            logger.info("The specified time range has already passed.")

    @staticmethod
    def get_next_monthly_date(target_day: int, task_time: str) -> datetime:
        """Calculate the next date for a monthly task."""
        today = datetime.now()
        current_year, current_month = today.year, today.month

        try:
            next_date = datetime(current_year, current_month, target_day, *map(int, task_time.split(":")))
            if next_date > today:
                return next_date
        except ValueError:
            pass

        # Move to the next month
        if current_month == 12:
            return datetime(current_year + 1, 1, target_day, *map(int, task_time.split(":")))
        return datetime(current_year, current_month + 1, target_day, *map(int, task_time.split(":")))

    @staticmethod
    def get_next_yearly_date(target_month: int, target_day: int, task_time: str) -> datetime:
        """Calculate the next date for a yearly task."""
        today = datetime.now()
        current_year = today.year

        try:
            next_date = datetime(current_year, target_month, target_day, *map(int, task_time.split(":")))
            if next_date > today:
                return next_date
        except ValueError:
            pass

        return datetime(current_year + 1, target_month, target_day, *map(int, task_time.split(":")))

    def __load_tasks(self) -> dict:
        """Load tasks from JSON file"""
        if os.path.exists(self.__scheduler_file):
            try:
                with open(self.__scheduler_file, 'r') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                logger.warning("Scheduler JSON file corrupted. Starting with empty registry.")
                return {}
        return {}
    
    def __save_tasks(self) -> None:
        """Save tasks to JSON file"""
        try:
            # Ensure directory exists
            os.makedirs(os.path.dirname(self.__scheduler_file), exist_ok=True)
            
            # Debug current registry
            logger.debug(f"Current task registry: {self.__task_registry}")
            
            # Convert datetime objects to strings
            serializable_tasks = {}
            for task_id, task_info in self.__task_registry.items():
                serializable_task = task_info.copy()
                
                # Handle datetime fields
                if isinstance(task_info.get("last_run"), datetime):
                    serializable_task["last_run"] = task_info["last_run"].isoformat()
                if isinstance(task_info.get("next_run"), datetime):
                    serializable_task["next_run"] = task_info["next_run"].isoformat()
                
                serializable_task["schedule_job"] = None
                serializable_tasks[task_id] = serializable_task
            
            # Write to file with proper indentation
            with open(self.__scheduler_file, 'w') as f:
                json.dump(serializable_tasks, f, indent=2, cls=DateTimeEncoder)
                f.flush()
                os.fsync(f.fileno())
            
            logger.info(f"Tasks saved successfully to {self.__scheduler_file}")
            
        except Exception as e:
            logger.error(f"Error saving scheduler state: {str(e)}", exc_info=True)
            raise
