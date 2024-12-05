# activity_logging.py
import logging
import os

# Define log file path specific to activity data
ACTIVITY_LOG_FILE = os.path.join(os.path.dirname(__file__), "activity_data.log")

# Configure logger for activity data
activity_logger = logging.getLogger("activity_logger")
activity_logger.setLevel(logging.INFO)

# Create file handler for logging activity data
file_handler = logging.FileHandler(ACTIVITY_LOG_FILE)
file_handler.setLevel(logging.INFO)

# Create formatter and add to handler
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)

# Add the handler to the logger
activity_logger.addHandler(file_handler)

# Optional: Add console handler for real-time console logs (for debugging)
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_handler.setFormatter(formatter)
activity_logger.addHandler(console_handler)

activity_logger.info("Activity logger set up.")
