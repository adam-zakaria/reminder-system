import schedule
import time
import subprocess
from datetime import datetime
from threading import Thread


class SchedulerService:
    def __init__(self):
        """Initialize the scheduler service."""
        self.scheduler_thread = Thread(target=self.run_scheduler, daemon=True)

    def run_scheduler(self):
        """Run the scheduler in a separate thread."""
        while True:
            schedule.run_pending()
            time.sleep(1)

    def start(self):
        """Start the scheduler thread."""
        print("Scheduler service started.")
        self.scheduler_thread.start()

    def add_task(self, recurrence_type, function_name, params):
        """
        Add a new task to the scheduler.

        :param recurrence_type: 'daily', 'weekly', 'monthly', 'yearly'
        :param function_name: The Python function to call
        :param params: Additional parameters to pass to the function
        """
        def execute_task():
            """Execute the scheduled Python function with parameters."""
            print(f"Executing task: {function_name} at {datetime.now().isoformat()}")

            # Prepare command with parameters
            param_string = ' '.join(map(str, params))
            command = f"python3 script.py {function_name} {datetime.now().isoformat()} {param_string}"

            # Execute the command
            try:
                result = subprocess.run(command, shell=True, check=True, text=True, capture_output=True)
                print(f"Output:\n{result.stdout}")
            except subprocess.CalledProcessError as e:
                print(f"Error executing task:\n{e.stderr}")

        # Schedule the task based on the recurrence type
        if recurrence_type == 'daily':
            schedule.every().day.at("00:00").do(execute_task)
        elif recurrence_type == 'weekly':
            schedule.every().sunday.at("00:00").do(execute_task)
        elif recurrence_type == 'monthly':
            schedule.every().month.at("00:00").do(execute_task)
        elif recurrence_type == 'yearly':
            schedule.every().year.at("00:00").do(execute_task)
        else:
            print(f"Unsupported recurrence type: {recurrence_type}")
            return

        print(f"Task added: {function_name} ({recurrence_type})")


# Example usage
if __name__ == "__main__":
    scheduler = SchedulerService()
    scheduler.start()  # Start the scheduler service