from utils import utils

# First add the path
utils.ip('/home/ubuntu/code/reminder-system/bots/')
utils.ip('/home/ubuntu/code/reminder-system/bots/mvp/mqtt_client/')

# Now you can import from the added path
from tests import state_machine_helper
from tests.state_machine_helper import state_machines
from utils import utils
import json

def format_code(code):
    """Format the generated code with proper indentation."""
    # Split the code into lines
    lines = code.split('\n')
    # Remove empty lines at start and end
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()
    # Join with proper newlines
    return '\n'.join(lines)

reminders = utils.jl('reminders_20.json')['reminders']
for reminder in reminders:
    state_machine_helper.create_state_machine(reminder['reminder'])

utils.jd(state_machines, 'test_state_machines_menu.json')
