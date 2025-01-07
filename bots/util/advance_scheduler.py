from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SchedulerService:
    def __init__(self):
        """Initialize the scheduler service."""
        self.scheduler = BackgroundScheduler()
        self.task_registry = {}  # Registry for tracking scheduled tasks

    def start(self):
        """Start the scheduler service."""
        logger.info("Scheduler service started.")
        self.scheduler.start()

    def add_task(self, date, start_time, end_time, recurrence_type, function_name, days=None):
        """
        Add a new task to the scheduler.

        :param date: Date string (e.g., '2024-09-10', 'today', or 'tomorrow').
        :param start_time: Start time in 'HH:MM' format (e.g., '09:00').
        :param end_time: End time in 'HH:MM' format (e.g., '10:00').
        :param recurrence_type: 'once', 'daily', 'weekly', 'monthly', 'yearly'.
        :param function_name: The Python function to call.
        :param days: List of days for weekly recurrence (e.g., ['Monday', 'Wednesday']).
        """
        def execute_task():
            """Execute the scheduled task."""
            logger.info(f"Executing task: {function_name} at {datetime.now().isoformat()}")
            function = globals().get(function_name)
            if callable(function):
                try:
                    function()
                except Exception as e:
                    logger.error(f"Error executing task '{function_name}': {e}")
            else:
                logger.error(f"Function '{function_name}' not found.")

        try:
            # Parse date and time
            target_date = self.parse_date(date)
            start_datetime, end_datetime = self.parse_time_window(target_date, start_time, end_time)

            # Schedule tasks based on recurrence type
            if recurrence_type == 'once':
                self.schedule_once(start_datetime, execute_task)
            elif recurrence_type == 'daily':
                self.schedule_daily(start_time, execute_task)
            elif recurrence_type == 'weekly' and days:
                self.schedule_weekly(start_time, days, execute_task)
            elif recurrence_type == 'monthly':
                self.schedule_monthly(target_date.day, start_time, execute_task)
            elif recurrence_type == 'yearly':
                self.schedule_yearly(target_date.month, target_date.day, start_time, execute_task)
            else:
                logger.warning(f"Unsupported recurrence type: {recurrence_type}")
        except Exception as e:
            logger.error(f"Error scheduling task '{function_name}': {e}")

    @staticmethod
    def parse_date(date_str):
        """Parse the date string into a date object."""
        if date_str.lower() == 'today':
            return datetime.now().date()
        elif date_str.lower() == 'tomorrow':
            return (datetime.now() + timedelta(days=1)).date()
        try:
            return datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            raise ValueError(f"Invalid date format: {date_str}")

    @staticmethod
    def parse_time_window(target_date, start_time, end_time):
        """Parse start and end times into datetime objects."""
        try:
            start_datetime = datetime.combine(target_date, datetime.strptime(start_time, "%H:%M").time())
            end_datetime = datetime.combine(target_date, datetime.strptime(end_time, "%H:%M").time()) if end_time else start_datetime
            return start_datetime, end_datetime
        except ValueError:
            raise ValueError(f"Invalid time format: start_time={start_time}, end_time={end_time}")

    def schedule_once(self, start_datetime, execute_task):
        """Schedule a one-time task."""
        self.scheduler.add_job(execute_task, DateTrigger(run_date=start_datetime))
        logger.info(f"One-time task scheduled for {start_datetime.isoformat()}")

    def schedule_daily(self, start_time, execute_task):
        """Schedule a daily task."""
        trigger = CronTrigger(hour=int(start_time.split(":")[0]), minute=int(start_time.split(":")[1]))
        self.scheduler.add_job(execute_task, trigger)
        logger.info(f"Daily task scheduled at {start_time}")

    def schedule_weekly(self, start_time, days, execute_task):
        """Schedule a weekly task on specified days."""
        for day in days:
            trigger = CronTrigger(day_of_week=day.lower(), hour=int(start_time.split(":")[0]), minute=int(start_time.split(":")[1]))
            self.scheduler.add_job(execute_task, trigger)
        logger.info(f"Weekly task scheduled at {start_time} on {', '.join(days)}")

    def schedule_monthly(self, target_day, start_time, execute_task):
        """Schedule a monthly task."""
        trigger = CronTrigger(day=target_day, hour=int(start_time.split(":")[0]), minute=int(start_time.split(":")[1]))
        self.scheduler.add_job(execute_task, trigger)
        logger.info(f"Monthly task scheduled on day {target_day} at {start_time}")

    def schedule_yearly(self, target_month, target_day, start_time, execute_task):
        """Schedule a yearly task."""
        trigger = CronTrigger(month=target_month, day=target_day, hour=int(start_time.split(":")[0]), minute=int(start_time.split(":")[1]))
        self.scheduler.add_job(execute_task, trigger)
        logger.info(f"Yearly task scheduled on {target_month}/{target_day} at {start_time}")
