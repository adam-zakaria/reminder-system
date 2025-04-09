### This file tests the json approach of the reminder system ### 
### See ./README.md for more information on test inputs ### 

### Imports ### 
import utils
from datetime import datetime

def evaluate_condition(sensor_update, condition, reset=False):
    """Evaluate a single condition given a sensor update."""
    print('Evaluating condition:')
    print(condition)
    # simple cases - sensor value comparisons
    if condition['comparison'] == 'equals':
        if sensor_update['value'] == condition['value']:
            condition['met'] = True
            condition['time_met'] = datetime.now()
    elif condition['comparison'] == 'greater_than':
        if sensor_update['value'] > condition['value']:
            condition['met'] = True
            condition['time_met'] = datetime.now()
    elif condition['comparison'] == 'less_than':
        if sensor_update['value'] < condition['value']:
            condition['met'] = True
            condition['time_met'] = datetime.now()
    elif condition['comparison'] == 'greater_than_or_equal_to':
        if sensor_update['value'] >= condition['value']:
            condition['met'] = True
            condition['time_met'] = datetime.now()
    # simple case - time comparison
    elif condition['comparison'] == 'time':
        if sensor_update['timestamp'] >= condition['value']:
            condition['met'] = True
            condition['time_met'] = datetime.now()
    if reset:
        return True
    else:
        return False

def main(test_path):
    ### Load the reminder system inputs - simulate sensor updates and reminders ###
    test = utils.jl(test_path)
    sensor_updates = test['sensor_updates']
    reminders = test['reminders']

    ### Run the reminder system and decide if reminders should fire ###
    for sensor_update in sensor_updates:  # process sensor data as it arrives
        for reminder in reminders:  # Create a copy of reminders to safely remove items
            if reminder['sequential_conditions'] == True:  # Some reminders have conditions that must be met in sequence
                # 1) First pass - Check reset conditions, only sequential conditions might be reset
                print('--- Evaluating reset conditions ---')
                for condition in reminder['reset_conditions']:
                    reset = evaluate_condition(sensor_update, condition, reset=True)
                    if reset:
                        # reset all conditions
                        for condition in reminder['conditions']:
                            condition['met'] = False
                            condition['time_met'] = None
                    if reset:
                        break # Stop evaluating reset conditions. Only one reset condition needs to be met to reset all conditions
                if reset:
                    break # Move on to the next reminder
                # 2) Second pass - Check (regular) conditions
                for condition in reminder['conditions']:
                    print('--- Evaluating regular conditions ---')
                    evaluate_condition(sensor_update, condition)
                # 3) Check if all conditions are met
                print(reminder['conditions'])
                if all(condition['met'] for condition in reminder['conditions']):
                  # If so, trigger the reminder
                  print('**************************************************')
                  print(f"Reminder triggered: {reminder['prompt']}")
                  print(reminder['prompt'])
                  break
            else: # reminder['sequential_conditions'] == False
                # 1) Check conditions
                for condition in reminder['conditions']:
                    print('Evaluating conditions:')
                    evaluate_condition(sensor_update, condition)
                # 2) Check if all conditions are met
                if all(condition['met'] for condition in reminder['conditions']):
                  # If so, trigger the reminder
                  print('**************************************************')
                  print(f"Reminder triggered: {reminder['prompt']}")
                  print(reminder['prompt'])
                  break # This might be wrong

if __name__ == "__main__":
    test_path = './11/trigger.json'
    main(test_path)