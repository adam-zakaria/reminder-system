import logging
import os

# Define log file path for state machine logs
STATE_MACHINE_LOG_FILE = os.path.join(os.path.dirname(__file__), "../state_machine.log")

# Configure the logger for state machine data
state_machine_logger = logging.getLogger("state_machine_logger")
state_machine_logger.setLevel(logging.DEBUG)  # Set to DEBUG to capture all levels

# Create file handler for logging state machine data
file_handler = logging.FileHandler(STATE_MACHINE_LOG_FILE)
file_handler.setLevel(logging.DEBUG)  # Set to DEBUG for all-level logging

# Create formatter and add it to the handler
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
file_handler.setFormatter(formatter)

# Add the handler to the logger
state_machine_logger.addHandler(file_handler)

# Optional: Console handler for debugging
# console_handler = logging.StreamHandler()
# console_handler.setLevel(logging.DEBUG)  # Set to DEBUG for console output as well
# console_handler.setFormatter(formatter)
# state_machine_logger.addHandler(console_handler)

state_machine_logger.debug("State machine logger initialized with DEBUG level.")
