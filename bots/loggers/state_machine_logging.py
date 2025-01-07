import logging
import os

# Create logs directory if it doesn't exist
log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'logs')
os.makedirs(log_dir, exist_ok=True)

# Configure logging
state_machine_logger = logging.getLogger('state_machine')
state_machine_logger.setLevel(logging.DEBUG)

# Create file handler
log_file = os.path.join(log_dir, 'state_machine.log')
file_handler = logging.FileHandler(log_file)
file_handler.setLevel(logging.DEBUG)

# Create console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

# Create formatter
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(formatter)
console_handler.setFormatter(formatter)

# Add handlers to logger
state_machine_logger.addHandler(file_handler)
state_machine_logger.addHandler(console_handler)

state_machine_logger.debug("State machine logger initialized with DEBUG level.")
