#!/usr/bin/env python3

def statemachine1(time, state_house, state_person, blackboard):
        # Initialize the default state for the microwave in the blackboard
    blackboard.setdefault('state', 'Idle')
    blackboard.setdefault('previous_state', None)  # To store the previous state

    state = blackboard['state']
    person_activity = state_person.get('activity')

    # Store the current state as the previous state before changing it
    blackboard['previous_state'] = state
    
    if state == 'Idle' and person_activity == 'Meal_Preparation':
        blackboard['state'] = 'Cooking'
        return True
    
def statemachine2(time, state_house, state_person, blackboard):
    
    if state_person.get('activity') == 'Meal_Preparation':
        return True
    return False 

def statemachien3(curr_time, house, person, blackboard):
    if curr_time == "8pm":
        return True
    return False


def statemachine(time, state_house, state_person, blackboard):
    """
    :param time: The current time of execution.
    :param state_house: Current state of the microwave (e.g., power, door status).
    :param state_person: Current activity or state of the person (e.g., 'reheating').
    :param blackboard: A dictionary storing the current and previous state.
    :return: Boolean indicating whether the state of the microwave has changed.
    """
    
    # Initialize the default state for the microwave in the blackboard
    blackboard.setdefault('state', 'Idle')
    blackboard.setdefault('previous_state', None)  # To store the previous state

    state = blackboard['state']
    person_activity = state_person.get('activity')

    # Store the current state as the previous state before changing it
    blackboard['previous_state'] = state

    # State transitions based on the microwave's sensor data (door status and power)
    if state == 'Idle' and person_activity == 'Meal_Preparation':
        if state_house.get('doorStatus') == 1:  # Door is opened
            blackboard['state'] = 'Door Opened'
            return True  # State has changed

    elif state == 'Door Opened':
        if state_house.get('doorStatus') == 0:  # Door is closed
            blackboard['state'] = 'Door Closed Before Reheating'
            return True  # State has changed

    elif state == 'Door Closed Before Reheating':
        if state_house.get('power') > 500:  # Power is above the threshold (heating is occurring)
            blackboard['state'] = 'Power Increase'
            return True  # State has changed

    elif state == 'Power Increase':
        if state_house.get('power') < 500:  # Power drops (heating has stopped)
            blackboard['state'] = 'Reheated'
            return True  # State has changed

    elif state == 'Reheated':
        if state_house.get('doorStatus') == 1:  # Door is opened after reheating
            blackboard['state'] = 'Idle'  # Reset the state back to Idle
            return False  # Returning False since the microwave is now idle and there's no need for further actions

    return False  # No change in state

import datetime

def reminder_function(reminder_text, reminder_time=None, sensor_data=None, activity_data=None):
    # Helper function to get current time
    def get_current_time():
        return datetime.datetime.now()

    # Helper function to parse ISO 8601 time
    def parse_iso_time(iso_time):
        return datetime.datetime.fromisoformat(iso_time)

    # Helper function to infer tomorrow at 8 AM
    def infer_tomorrow_8am():
        now = get_current_time()
        tomorrow = now + datetime.timedelta(days=1)
        return datetime.datetime(tomorrow.year, tomorrow.month, tomorrow.day, 8, 0, 0)

    # Set reminder time
    if reminder_time:
        reminder_time = parse_iso_time(reminder_time)
    else:
        reminder_time = infer_tomorrow_8am()

    # Main loop to check time and activity
    while True:
        current_time = get_current_time()

        # Check if current time matches reminder time
        if current_time >= reminder_time:
            if activity_data:
                activity = activity_data.get('activity')
                activity_status = activity_data.get('activity_status')
                if activity == 'Sleeping' and activity_status == 'end':
                    if sensor_data and sensor_data.get('motionDetected') == 'bedroom':
                        print(reminder_text)
                        break
            else:
                print(reminder_text)
                break

# Example usage
reminder_function("Take your medication", sensor_data={'motionDetected': 'bedroom'}, activity_data={'activity': 'Sleeping', 'activity_status': 'end'})

import datetime

def handle_reminder(reminder_text, reminder_time=None, sensor_data=None, activity_data=None):
    from time import sleep
    
    # Determine the reminder time
    if reminder_time is None:
        tomorrow = datetime.datetime.now() + datetime.timedelta(days=1)
        reminder_time = datetime.datetime(tomorrow.year, tomorrow.month, tomorrow.day, 8, 0)
    else:
        reminder_time = datetime.datetime.fromisoformat(reminder_time)
    
    # Function to check if the current time matches the reminder time
    def is_time_for_reminder(current_time):
        return current_time >= reminder_time
    
    # Function to check activity and sensor data
    def is_condition_met():
        if activity_data:
            activity = activity_data.get('activity')
            activity_status = activity_data.get('activity_status')
            if activity == 'Sleeping' and activity_status == 'end':
                if sensor_data:
                    motion_detected = sensor_data.get('motionDetected', False)
                    return motion_detected
        return False
    
    # Main loop to check the conditions continuously
    while True:
        current_time = datetime.datetime.now()
        
        # Check if it's time for the reminder and if conditions are met
        if is_time_for_reminder(current_time):
            if activity_data:
                if is_condition_met():
                    print(reminder_text)
                    break
            else:
                print(reminder_text)
                break
        
        # Sleep for a while before checking again
        sleep(60)  # Check every minute