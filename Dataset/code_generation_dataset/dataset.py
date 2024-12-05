from datetime import datetime, timedelta

#remind me clean the kitchen tomorrow morning after breakfast
# {
#   "task": "Clean the kitchen",
#   "date": "tomorrow",
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "morning"
#   },
#   "recurrence": {
#     "type": "once",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_clean_kitchen_tomorrow_morning(time, activity_data, sensor_data, blackboard):
    try :
        if time:
            current_time = datetime.fromisoformat(time)
            target_start_time = current_time.replace(hour=6, minute=0, second=0, microsecond=0)
            target_end_time = current_time.replace(hour=12, minute=0, second=0, microsecond=0)
            
            if current_time < target_start_time or current_time >= target_end_time:
                return False
            else:
                pass
            
        if activity_data:
            if activity_data.get('activity') == "Meal_Preparation" and activity_data.get('activity_status') == "start":
                return True
            else:
                return False
    except ValueError:
        return False
    
    return False
            

# remind to wash dishes in the evening after having dinner
# {
#   "task": "Wash dishes",
#   "date": null,
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "evening"
#   },
#   "recurrence": {
#     "type": "once",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_wash_dishes_evening(time, activity_data, sensor_data, blackboard):
    try :
        if time:
            current_time = datetime.fromisoformat(time)
            target_start_time = current_time.replace(hour=18, minute=0, second=0, microsecond=0)
            target_end_time = current_time.replace(hour=21, minute=0, second=0, microsecond=0)
            
            if current_time < target_start_time or current_time >= target_end_time:
                return False
            else:
                pass
            
        if activity_data:
            if activity_data.get('activity') == "Eating" and activity_data.get('activity_status') == "end":
                return True
            else:
                return False
    except ValueError:
        return False
    
    return False
            
# remind to close the door after coming home
# {
#   "task": "Close the door after coming home",
#   "date": null,
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": null
#   },
#   "recurrence": {
#     "type": "once",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_close_door(time, activity_data, sensor_data, blackboard):
    try:
        current_time = datetime.fromisoformat(time)
        
        if activity_data:
            # Step 1: Detect when the person enters home
            if activity_data.get('activity') == "Enter_Home" and activity_data.get('activity_status') == "end":
                # Record the time of entry into the blackboard, but do not check immediately
                if 'enter_home_time' not in blackboard:
                    blackboard['enter_home_time'] = current_time
                    return False  # Don't check yet, just store the entry time

        # Step 2: After 5 minutes, check if the door is still open
        if 'enter_home_time' in blackboard:
            enter_home_time = blackboard['enter_home_time']
            if current_time >= enter_home_time + timedelta(minutes=5):
                # Check if the door is still open
                if sensor_data and sensor_data.get('main_door_entry_sensor') == 'open':
                    return True  # Remind to close the door
                else:
                    # Door is closed, clear the enter_home_time from the blackboard
                    del blackboard['enter_home_time']
                    return False

    except ValueError:
        return False
    
    return False

# remind me to brush my teeth after I wake up
# {
#   "task": "Brush my teeth",
#   "date": null,
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "morning"
#   },
#   "recurrence": {
#     "type": "daily",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_wakeup_brushTeeth(time, activity_data, sensor_data, blackboard):
    try :
            
        if activity_data:
            if activity_data.get('activity') == "Sleeping" and activity_data.get('activity_status') == "end":
                return True
            
    except ValueError:
        return False
    
    return False

# remind me to brush my teeth before going to bed
# {
#   "task": "Brush my teeth",
#   "date": null,
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "before bed"
#   },
#   "recurrence": {
#     "type": "daily",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_beforegoingtobed_brushTeeth(time, activity_data, sensor_data, blackboard):
    try :
        
        if time:
            current_time = datetime.fromisoformat(time)
            target_start_time = current_time.replace(hour=9, minute=0, second=0, microsecond=0)
            target_end_time = current_time.replace(hour=23, minute=59, second=0, microsecond=0)
            
            if current_time < target_start_time or current_time >= target_end_time:
                return False
            
        if activity_data:
            if activity_data.get('activity') == "Sleeping" and activity_data.get('activity_status') == "start":
                return True
            
    except ValueError:
        return False
    
    return False


# remind me to turn off the stove after cooking
# {
#   "task": "Turn off the stove after cooking",
#   "date": null,
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": null
#   },
#   "recurrence": {
#     "type": "once",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_turnoffStove_afterCooking(time, activity_data, sensor_data, blackboard):
    try :
        
        if sensor_data:
            stove_sensor = sensor_data.get('stove_temp_humidity_sensor')
            if stove_sensor and stove_sensor.get('temp', 0) >= 10:
                if activity_data:
                    if activity_data.get('activity') == "Meal_Preparation" and activity_data.get('activity_status') == "end":
                        return True
            
    except ValueError:
        return False
    
    return False


# remind me to call my daughter tomorrow morning after I wake up

# {
#   "task": "Call my daughter",
#   "date": "tomorrow",
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "morning"
#   },
#   "recurrence": {
#     "type": "once",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_call_Daughter_tomorrow_morning(time, activity_data, sensor_data, blackboard):
    try :
        if time:
            current_time = datetime.fromisoformat(time)
            target_start_time = current_time.replace(hour=6, minute=0, second=0, microsecond=0)
            target_end_time = current_time.replace(hour=12, minute=0, second=0, microsecond=0)
            
            if current_time < target_start_time or current_time >= target_end_time:
                return False

            
        if activity_data:
            if activity_data.get('activity') == "Sleeping" and activity_data.get('activity_status') == "ends":
                return True
            
    except ValueError:
        return False
    
    return False

# remind me to call my daughter after lunch
# {
#   "task": "Call my daughter",
#   "date": null,
#   "exact_time": null,
#   "time_inferred": "afternoon",
#   "recurrence": "once",
#   "priority": "medium"
# }

# {
#   "task": "Call my daughter after lunch",
#   "date": null,
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "after lunch"
#   },
#   "recurrence": {
#     "type": "once",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_call_Daughter__afterlunch(time, activity_data, sensor_data, blackboard):
    try :
        if time:
            current_time = datetime.fromisoformat(time)
            target_start_time = current_time.replace(hour=12, minute=0, second=0, microsecond=0)
            target_end_time = current_time.replace(hour=18, minute=0, second=0, microsecond=0)
            
            if current_time < target_start_time or current_time >= target_end_time:
                return False

            
        if activity_data:
            if activity_data.get('activity') == "Eating" and activity_data.get('activity_status') == "ends":
                return True
            
    except ValueError:
        return False
    
    return False

# remind me to call my daughter before lunch
# {
#   "task": "Call my daughter",
#   "date": null,
#   "exact_time": null,
#   "time_inferred": "before lunch",
#   "recurrence": "once",
#   "priority": "medium"
# }

# {
#   "task": "Call my daughter",
#   "date": null,
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "before lunch"
#   },
#   "recurrence": {
#     "type": "once",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_call_Daughter__beforelunch(time, activity_data, sensor_data, blackboard):
    try :
        if time:
            current_time = datetime.fromisoformat(time)
            target_start_time = current_time.replace(hour=12, minute=0, second=0, microsecond=0)
            target_end_time = current_time.replace(hour=18, minute=0, second=0, microsecond=0)
            
            if current_time < target_start_time or current_time >= target_end_time:
                return False

            
        if activity_data:
            if activity_data.get('activity') == "Eating" and activity_data.get('activity_status') == "starts":
                return True
            
    except ValueError:
        return False
    
    return False

# remind me to call my daughter after dinner
# {
#   "task": "Call my daughter",
#   "date": null,
#   "exact_time": null,
#   "time_inferred": "after dinner",
#   "recurrence": "once",
#   "priority": "medium"
# }

# {
#   "task": "Call my daughter",
#   "date": null,
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "after dinner"
#   },
#   "recurrence": {
#     "type": "once",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_call_Daughter__afterDinner(time, activity_data, sensor_data, blackboard):
    try :
        if time:
            current_time = datetime.fromisoformat(time)
            target_start_time = current_time.replace(hour=18, minute=0, second=0, microsecond=0)
            target_end_time = current_time.replace(hour=23, minute=59, second=0, microsecond=0)
            
            if current_time < target_start_time or current_time >= target_end_time:
                return False

            
        if activity_data:
            if activity_data.get('activity') == "Eating" and activity_data.get('activity_status') == "ends":
                return True
            
    except ValueError:
        return False
    
    return False

# remind me cook after I come home

# {
#   "task": "Cook after I come home",
#   "date": null,
#   "exact_time": null,
#   "time_inferred": null,
#   "recurrence": "once",
#   "priority": "medium"
# }

# {
#   "task": "Call my daughter",
#   "date": null,
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "after dinner"
#   },
#   "recurrence": {
#     "type": "once",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_cook_afterIcomehome(time, activity_data, sensor_data, blackboard):
    try:
        if activity_data:
            if activity_data.get('activity') == 'Enter_Home' and activity_data.get('activity_status') == 'start':
                return True

    except ValueError:
            return False
        
    return False

# remind me cook dinner after I come home in the evening amd relax for an hour
# {
#   "task": "Cook dinner after coming home relaxing for an hour",
#   "date": null,
#   "exact_time": null,
#   "time_inferred": "evening",
#   "recurrence": "once",
#   "priority": "medium"
# }

# {
#   "task": "Cook dinner after coming home relaxing for an hour",
#   "date": null,
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "evening"
#   },
#   "recurrence": {
#     "type": "once",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_cook_dinner_after_relaxing(time, activity_data, sensor_data, blackboard):
    try:
        if time:
            current_time = datetime.fromisoformat(time)
            evening_start_time = current_time.replace(hour=17, minute=0, second=0, microsecond=0)
            evening_end_time = current_time.replace(hour=21, minute=0, second=0, microsecond=0)
            
            if current_time < evening_start_time or current_time >= evening_end_time:
                return False

        # Check if the user has come home and relaxed for an hour
        if activity_data:
            if activity_data.get('activity') == "Enter_Home" and activity_data.get('activity_status') == "end":
                if 'relax_start_time' in blackboard:
                    relax_start_time = blackboard['relax_start_time']
                    if current_time >= relax_start_time + timedelta(hours=1):
                        return True
                else:
                    # If the user just entered home, mark the relax start time on the blackboard
                    blackboard['relax_start_time'] = current_time
        
        return False

    except (ValueError, KeyError):
        return False
    
    
# everytime the stove is on when I am not cooking remind me to turn it off
# {
#   "task": "Turn off the stove when I am not cooking",
#   "date": null,
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": null
#   },
#   "recurrence": {
#     "type": "daily",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "multiple"
#     }
#   },
#   "priority": "medium"
# }

def reminder_turnoff_stove_when_not_cooking(time=None, activity_data=None, sensor_data=None, blackboard=None):
    try:
        if sensor_data and sensor_data.get('stove_temp_humidity_sensor', {}).get('temp', 0) > 50:
            if not (activity_data and activity_data.get('activity') == "Meal_Preparation" and activity_data.get('activity_status') == "start"):
                return True
    except (ValueError, KeyError):
        return False
    return False


# can you remind me everyday to take my medicine after an hour of my lunch 

# {
#   "task": "Take my medicine",
#   "date": null,
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "after an hour of my lunch"
#   },
#   "recurrence": {
#     "type": "daily",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_take_medicine_after_lunch(time=None, activity_data=None, sensor_data=None, blackboard=None):
    try:
        if time:
            current_time = datetime.fromisoformat(time)

            lunch_start_time = current_time.replace(hour=12, minute=0, second=0, microsecond=0)
            lunch_end_time = current_time.replace(hour=15, minute=0, second=0, microsecond=0)

            if blackboard:
                recorded_lunch_end_time = blackboard.get('lunch_end_time')

                if recorded_lunch_end_time:
                    one_hour_after_lunch = recorded_lunch_end_time + timedelta(hours=1)
                    
                    if one_hour_after_lunch <= current_time < (one_hour_after_lunch + timedelta(minutes=5)):
                        return True

        # If lunch ends within the lunch window, store the time in blackboard
        if activity_data:
            if activity_data.get('activity') == 'Eating' and activity_data.get('activity_status') == 'end':
                if lunch_start_time <= current_time <= lunch_end_time:
                    if blackboard is not None:
                        blackboard['lunch_end_time'] = current_time

    except (ValueError, KeyError):
        return False

    return False


# can you remind me everyday to take my vitamins after breakfast

# {
#   "task": "Take my vitamins",
#   "date": null,
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "after breakfast"
#   },
#   "recurrence": {
#     "type": "daily",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_take_vitamins_after_breakfast(time=None, activity_data=None, sensor_data=None, blackboard=None):
    try:
        if time:
            current_time = datetime.fromisoformat(time)

        # Check if it's after breakfast time (assuming breakfast is between 7 AM and 9 AM)
        if current_time and blackboard and 'breakfast_end_time' in blackboard:
            if blackboard['breakfast_end_time'] + timedelta(minutes=20) <= current_time < blackboard['breakfast_end_time'] + timedelta(minutes=35):
                return True

        # Record breakfast end time if it ends within the expected breakfast window (7 AM to 10 AM)
        if activity_data and current_time:
            if activity_data.get('activity') == 'Eating' and activity_data.get('activity_status') == 'end':
                breakfast_start, breakfast_end = current_time.replace(hour=7, minute=0), current_time.replace(hour=10, minute=0)
                if breakfast_start <= current_time <= breakfast_end:
                    blackboard['breakfast_end_time'] = current_time

    except (ValueError, KeyError):
        return False

    return False

# can you remind me everyday to take my tablets after Dinner

# {
#   "task": "Take my tablets",
#   "date": null,
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "after dinner"
#   },
#   "recurrence": {
#     "type": "daily",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_take_tablets_after_dinner(time=None, activity_data=None, sensor_data=None, blackboard=None):
    try:
        # Parse the current time if provided
        if time:
            current_time = datetime.fromisoformat(time)
        
        # Trigger reminder after dinner ends (assuming dinner is between 7 PM and 9 PM)
        if current_time and blackboard and 'dinner_end_time' in blackboard:
            dinner_end_time = blackboard['dinner_end_time']
            if dinner_end_time <= current_time < dinner_end_time + timedelta(minutes=20):
                return True

        # Record dinner end time if dinner activity ends within the expected dinner window (7 PM to 9 PM)
        if activity_data and current_time:
            if activity_data.get('activity') == 'Eating' and activity_data.get('activity_status') == 'end':
                dinner_start, dinner_end = current_time.replace(hour=19, minute=0), current_time.replace(hour=21, minute=0)
                if dinner_start <= current_time <= dinner_end:
                    blackboard['dinner_end_time'] = current_time

    except (ValueError, KeyError):
        return False

    return False

# can you remind me to take the food from the fridge for tomorrow morning's breakfast

# {
#   "task": "Take the food from the fridge for breakfast",
#   "date": "tomorrow",
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "morning"
#   },
#   "recurrence": {
#     "type": "once",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

from datetime import datetime, timedelta

def reminder_take_food_fridge_for_breakfast(time=None, activity_data=None, sensor_data=None, blackboard=None):
    try:
        # Set the target time to tomorrow morning between 6:00 AM and 8:00 AM
        target_start_time = datetime.now().replace(hour=6, minute=0, second=0, microsecond=0) + timedelta(days=1)
        target_end_time = target_start_time.replace(hour=8, minute=0, second=0, microsecond=0)

        # Check if the current time is within the morning window
        if time:
            current_time = datetime.fromisoformat(time)
            if not (target_start_time <= current_time <= target_end_time):
                return False

        # Check if the meal preparation activity has started
        if activity_data:
            if activity_data.get('activity') == "Meal_Preparation" and activity_data.get('activity_status') == "start":
                return True

    except ValueError:
        return False

    return False

# can you remind me to take the food from the fridge for today's dinner

# {
#   "task": "Take the food from the fridge for dinner",
#   "date": "today",
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "dinner"
#   },
#   "recurrence": {
#     "type": "once",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_take_food_fridge_for_dinner(time=None, activity_data=None, sensor_data=None, blackboard=None):
    try:
        if time and activity_data:
            current_time = datetime.fromisoformat(time)
            # Dinner time between 7:00 PM and 10:00 PM today
            if datetime.now().replace(hour=19, minute=0, second=0, microsecond=0) <= current_time <= datetime.now().replace(hour=22, minute=0, second=0, microsecond=0):
                if activity_data.get('activity') == "Meal_Preparation" and activity_data.get('activity_status') == "start":
                    return True
    except ValueError:
        pass

    return False

# remind me to take food from the fridge tomorrow when I return home in the evening

# {
#   "task": "Take food from the fridge",
#   "date": "tomorrow",
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "evening"
#   },
#   "recurrence": {
#     "type": "once",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_take_food_fridge_return_home(time=None, activity_data=None, sensor_data=None, blackboard=None):
    try:
        if time and activity_data:
            current_time = datetime.fromisoformat(time)
            evening_start = (datetime.now() + timedelta(days=1)).replace(hour=17, minute=0, second=0, microsecond=0)
            evening_end = evening_start.replace(hour=21)

            if (evening_start <= current_time <= evening_end and
                activity_data.get('activity') == "Enter_Home" and activity_data.get('activity_status') == "start"):
                return True

    except ValueError:
        pass

    return False

# can you help me to stop watching tv if I have watched for more than 3 hours a day
# {
#   "task": "Stop watching TV",
#   "date": null,
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": null
#   },
#   "recurrence": {
#     "type": "daily",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "once"
#     }
#   },
#   "priority": "medium"
# }

def reminder_stop_watching_tv(time=None, activity_data=None, sensor_data=None, blackboard=None):
    try:
        # Define the sensor name for the living room smart cable
        tv_power_sensor = 'living_room_smart_cable'

        # If the activity is 'Relax' and the status is 'start', track the start time in blackboard
        if activity_data:
            if activity_data.get('activity') == 'Relax' and activity_data.get('activity_status') == 'start':
                blackboard['relax_start_time'] = datetime.fromisoformat(time).isoformat()

        # If the TV is on (determined by power > 0), update the duration on the blackboard
        if sensor_data:
            power_data = sensor_data.get(tv_power_sensor, {}).get('power', 0)
            if power_data > 0:
                if 'relax_duration' not in blackboard:
                    blackboard['relax_duration'] = timedelta(0)

                # Calculate the elapsed time since the last update
                relax_start_time = blackboard.get('relax_start_time')
                if relax_start_time:
                    elapsed_time = datetime.fromisoformat(time) - datetime.fromisoformat(relax_start_time)
                    blackboard['relax_duration'] += elapsed_time
                    # Reset start time to prevent repeated additions for the same interval
                    blackboard['relax_start_time'] = datetime.fromisoformat(time).isoformat()

        # If the cumulative relax duration exceeds 3 hours, trigger the reminder
        if blackboard.get('relax_duration', timedelta(0)) > timedelta(hours=3):
            return True

    except (ValueError, KeyError):
        return False

    return False