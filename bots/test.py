generated_code = """
from datetime import datetime, timedelta

def handle_reminder(current_time, activity_data=None, state_data=None, blackboard=None):
    # Check if the task is "Take medicine 2 hours after breakfast"
    task_description = "Take medicine 2 hours after breakfast"

    # Check if the activity data is provided and relevant
    if activity_data:
        activity = activity_data.get('activity')
        activity_status = activity_data.get('activity_status')

        # Check if the activity is 'Eating' and status is 'end'
        if activity == 'Eating' and activity_status == 'end':
            # Calculate the target time 2 hours after breakfast
            target_time = current_time + timedelta(hours=2)
            # Check if the current time is after the target time
            if current_time >= target_time:
                return True
            else:
                return False

    # If no relevant activity data is provided, check for delay
    if "2 hours after breakfast" in task_description:
        # Calculate the target time 2 hours after breakfast
        target_time = current_time + timedelta(hours=2)
        # Check if the current time is after the target time
        if current_time >= target_time:
            return True
        else:
            return False

    # If no conditions are met, return False
    return False
"""
def _compile():
    try:
        compile(generated_code, '<string>', 'exec')
        print("Code is valid")
    except SyntaxError as e:
        print(f"Syntax error in generated code: {e}")
        
_compile()