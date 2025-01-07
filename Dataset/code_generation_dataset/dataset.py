from datetime import datetime, timedelta

#remind me clean the kitchen tomorrow morning after breakfast
# {
#   "task": "Clean the kitchen",
#   "date": "tomorrow",
#   "time": {
#     "exact_time": {
#       "start_time": "09:00",
#       "end_time": "10:00"
#     },
#     "time_inferred": "after breakfast"
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

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == "Meal_Preparation" and activity_data.get('status') == "start"


# remind to wash dishes in the evening after having dinner
# {
#   "task": "Wash the dishes in the evening after having dinner",
#   "date": "today",
#   "time": {
#     "exact_time": {
#       "start_time": "19:00",
#       "end_time": "21:00"
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


def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == "Eating" and activity_data.get('status') == "end"

            
# remind to close the door after coming home
# {
#   "task": "Close the door after coming home",
#   "date": "today",
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "after coming home"
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

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == "Enter_Home" and activity_data.get('status') == "end" and  sensor_data.get('main_door_entry_sensor') == 'open'

# remind me to brush my teeth after I wake up
{
  "task": "Brush my teeth after I wake up",
  "date": "today",
  "time": {
    "exact_time": {
      "start_time": "06:00",
      "end_time": "07:00"
    },
    "time_inferred": "after I wake up"
  },
  "recurrence": {
    "type": "daily",
    "details": {
      "days": null,
      "occurrence_frequency": "once"
    }
  },
  "priority": "medium"
}


def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == "Sleeping" and activity_data.get('status') == "end"

# remind me to brush my teeth before going to bed
{
  "task": "Brush my teeth before going to bed",
  "date": "today",
  "time": {
    "exact_time": {
      "start_time": "20:00",
      "end_time": "22:00"
    },
    "time_inferred": "before bedtime"
  },
  "recurrence": {
    "type": "daily",
    "details": {
      "days": null,
      "occurrence_frequency": "once"
    }
  },
  "priority": "medium"
}

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == "Sleeping" and activity_data.get('status') == "start"


# remind me to turn off the stove after cooking
# {
#   "task": "Turn off the stove after cooking",
#   "date": "today",
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "after cooking"
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

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
   return sensor_data.get('stove_temp_humidity_sensor', {}).get('status', False) and activity_data.get('activity') == "Meal_Preparation" and activity_data.get('status') == "end"


# remind me to call my daughter tomorrow morning after I wake up

# {
#   "task": "Call my daughter after I wake up",
#   "date": "tomorrow",
#   "time": {
#     "exact_time": {
#       "start_time": "06:00",
#       "end_time": "12:00"
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

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):   
    return activity_data.get('activity') == "Sleeping" and activity_data.get('status') == "end"


# remind me to call my daughter after lunch

# {
#   "task": "Call my daughter after lunch",
#   "date": "tomorrow",
#   "time": {
#     "exact_time": {
#       "start_time": "13:00",
#       "end_time": "15:00"
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

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == "Eating" and activity_data.get('status') == "end"


# remind me to call my daughter before lunch
# {
#   "task": "Call my daughter before lunch",
#   "date": "tomorrow",
#   "time": {
#     "exact_time": {
#       "start_time": "12:00",
#       "end_time": "15:00"
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

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == "Eating" and activity_data.get('status') == "start"

# remind me to call my daughter after dinner

# {
#   "task": "Call my daughter after dinner",
#   "date": "today",
#   "time": {
#     "exact_time": {
#       "start_time": "19:00",
#       "end_time": "22:00"
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

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == "Eating" and activity_data.get('status') == "end"


# remind me cook after I come home
# {
#   "task": "Cook after I come home",
#   "date": "tomorrow",
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "after I come home"
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

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == 'Enter_Home' and activity_data.get('status') == 'start'

# remind me cook dinner after I come home in the evening and relax for an hour
# {
#   "task": "Cook dinner after I come home and relax for one hour",
#   "date": "today",
#   "time": {
#     "exact_time": {
#       "start_time": "19:00",
#       "end_time": "21:00"
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

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    try:
        current_time = datetime.fromisoformat(time) if time else None
        
        if activity_data and activity_data.get('activity') == "Enter_Home" and activity_data.get('status') == "end":
            if blackboard and time:
                blackboard['relax_start_time'] = current_time
                return False
                
        if current_time and blackboard and 'relax_start_time' in blackboard:
            return current_time >= blackboard['relax_start_time'] + timedelta(hours=1)
            
    except ValueError:
        pass
    return False
    
    
# everytime the stove is on when I am not cooking remind me to turn it off
# {
#   "task": "Turn off the stove when it is on and I am not cooking",
#   "date": "today",
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

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return sensor_data.get('stove_temp_humidity_sensor', {}).get('status', False) and activity_data.get('activity') != "Meal_Preparation"



# can you remind me everyday to take my medicine after an hour of my lunch 

# {
#   "task": "Take my medicine an hour after lunch",
#   "date": "today",
#   "time": {
#     "exact_time": {
#       "start_time": "12:00",
#       "end_time": "18:00"
#     },
#     "time_inferred": "after lunch"
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

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    try:
        current_time = datetime.fromisoformat(time) if time else None
        lunch_end_time = blackboard.get('lunch_end_time') if blackboard else None

        # Store lunch end time when eating ends
        if activity_data and activity_data.get('activity') == 'Eating' and activity_data.get('status') == 'end':
            if time and blackboard is not None:
                blackboard['lunch_end_time'] = current_time
                return False

        # Check if it's 1 hour after lunch
        if current_time and lunch_end_time:
            return current_time >= lunch_end_time + timedelta(hours=1)
            
    except ValueError:
        pass
    return False


# can you remind me everyday to take my vitamins after breakfast

# {
#   "task": "Take my vitamins after breakfast",
#   "date": "today",
#   "time": {
#     "exact_time": {
#       "start_time": "09:00",
#       "end_time": "10:00"
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

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    try:
        current_time = datetime.fromisoformat(time) if time else None
        lunch_end_time = blackboard.get('breakfast_end_time') if blackboard else None

        # Store lunch end time when eating ends
        if activity_data and activity_data.get('activity') == 'Eating' and activity_data.get('status') == 'end':
            if time and blackboard is not None:
                blackboard['breakfast_end_time'] = current_time
                return False

        # Check if it's 1 hour after lunch
        if current_time and lunch_end_time:
            return current_time >= lunch_end_time + timedelta(hours=1)
            
    except ValueError:
        pass
    return False

# can you remind me everyday to take my tablets after Dinner

# {
#   "task": "Take my tablets after dinner",
#   "date": "today",
#   "time": {
#     "exact_time": {
#       "start_time": "19:00",
#       "end_time": "21:00"
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

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    try:
        current_time = datetime.fromisoformat(time) if time else None
        lunch_end_time = blackboard.get('dinner_end_time') if blackboard else None

        # Store lunch end time when eating ends
        if activity_data and activity_data.get('activity') == 'Eating' and activity_data.get('status') == 'end':
            if time and blackboard is not None:
                blackboard['dinner_end_time'] = current_time
                return False

        # Check if it's 1 hour after lunch
        if current_time and lunch_end_time:
            return current_time >= lunch_end_time + timedelta(hours=1)
            
    except ValueError:
        pass
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

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == "Meal_Preparation" and activity_data.get('status') == "start" and sensor_data.get('fridge_entry_sensor', {}).get('status', 'closed') == 'closed'

# can you remind me to take the food from the fridge for today's dinner

# {
#   "task": "Take the food from the fridge",
#   "date": "today",
#   "time": {
#     "exact_time": {
#       "start_time": "18:00",
#       "end_time": "22:00"
#     },
#     "time_inferred": "before I start cooking Dinner"
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

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == "Meal_Preparation" and activity_data.get('status') == "start" and sensor_data.get('fridge_entry_sensor', {}).get('status', 'closed') == 'closed'

# remind me to take food from the fridge tomorrow when I return home in the evening

# {
#   "task": "Take food from the fridge",
#   "date": "tomorrow",
#   "time": {
#     "exact_time": {
#       "start_time": "18:00",
#       "end_time": "21:00"
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

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == "Enter_Home" and activity_data.get('status') == "start" and sensor_data.get('fridge_entry_sensor', {}).get('status', 'closed') == 'closed'


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

def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    try:
        # Define the sensor name for the living room smart cable
        tv_power_sensor = 'living_room_smart_cable'

        # If the activity is 'Relax' and the status is 'start', track the start time in blackboard
        if activity_data:
            if activity_data.get('activity') == 'Relax' and activity_data.get('status') == 'start':
                blackboard['relax_start_time'] = datetime.now().isoformat()

        # If the TV is on (determined by power being True), update the duration on the blackboard
        if sensor_data:
            power_data = sensor_data.get(tv_power_sensor, {}).get('power', False)
            if power_data:
                if 'relax_duration' not in blackboard:
                    blackboard['relax_duration'] = timedelta(0)

                # Calculate the elapsed time since the last update
                relax_start_time = blackboard.get('relax_start_time')
                if relax_start_time:
                    elapsed_time = datetime.now() - datetime.fromisoformat(relax_start_time)
                    blackboard['relax_duration'] += elapsed_time
                    # Reset start time to prevent repeated additions for the same interval
                    blackboard['relax_start_time'] = datetime.now().isoformat()

        # If the cumulative relax duration exceeds 3 hours, trigger the reminder
        if blackboard.get('relax_duration', timedelta(0)) > timedelta(hours=3):
            return "You have been watching TV for more than 3 hours. Please take a break."

    except (ValueError, KeyError):
        return False

    return False

# Wash hands after cooking
# {
#   "task": "Wash hands after cooking",
#   "date": "today",
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "after cooking"
#   },
#   "recurrence": {
#     "type": "event-based",
#     "details": {
#       "days": null,
#       "occurrence_frequency": "multiple"
#     }
#   },
#   "priority": "medium"
# }
def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activtity') == "Meal_Preparation" and activity_data.get('status') == "end"

# Take medication after waking up
# {
#   "task": "Take medication after waking up",
#   "date": "today",
#   "time": {
#     "exact_time": {
#       "start_time": "06:00",
#       "end_time": "10:00"
#     },
#     "time_inferred": "after waking up"
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
def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activtity') == "Sleeping" and activity_data.get('status') == "end"

# Take out the trash when I come home tomorrow
# {
#   "task": "Take out the trash when I come home",
#   "date": "tomorrow",
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
def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activtity') == "Enter_Home" and activity_data.get('status') == "start"

# When I start leaving the house, make sure I check the stove
# {
#   "task": "Check the stove",
#   "date": "today",
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "when I start leaving the house"
#   },
#   "recurrence": {
#     "type": null,
#     "details": {
#       "days": null,
#       "occurrence_frequency": "multiple"
#     }
#   },
#   "priority": "medium"
# }
def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activtity') == "Leave_Home" and activity_data.get('status') == "start" and sensor_data.get('stove_temp_humidity_sensor').get('status')

# When I start leaving the house in the morning, remind me to take the trash
# {
#   "task": "Take the trash when I start leaving the house",
#   "date": "tomorrow",
#   "time": {
#     "exact_time": {
#       "start_time": "06:00",
#       "end_time": "12:00"
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
def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activtity') == "Leave_Home" and activity_data.get('status') == "start"

# If I watch TV for more than 3 hours, remind me to stop watching TV
# {
#   "task": "Stop watching TV if I watch for more than 3 hours",
#   "date": "today",
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
def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    if activity_data.get('activtity') == "Relax":
        status = activity_data.get('status')
        power = sensor_data.get('living_room_smart_cable', {}).get('power', False)
        
        if status == "start" and power:
            blackboard['relax_start_time'] = datetime.now()
            blackboard.setdefault('total_relax_time', timedelta())
        elif status == "end" and 'relax_start_time' in blackboard:
            start = blackboard.pop('relax_start_time')
            blackboard['total_relax_time'] += datetime.now() - start
        elif not power and 'relax_start_time' in blackboard:
            start = blackboard.pop('relax_start_time')
            blackboard['total_relax_time'] += datetime.now() - start
        elif power and 'relax_start_time' in blackboard:
            start = blackboard['relax_start_time']
            total_time = blackboard['total_relax_time'] + (datetime.now() - start)
            if total_time > timedelta(hours=3):
                return True
    return False

# If I leave food in the microwave for 1 minute, remind me to take it out
# {
#   "task": "Take food out of the microwave after 1 minute",
#   "date": "today",
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": null
#   },
#   "recurrence": {
#     "type": null,
#     "details": {
#       "days": null,
#       "occurrence_frequency": "multiple"
#     }
#   },
#   "priority": "medium"
# }
def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    microwave_on = sensor_data.get('microwave_smart_cable', {}).get('power', False)
    door_open = sensor_data.get('microwave_door_entry_sensor', {}).get('status', False)
    current_time = datetime.strptime(time, '%Y-%m-%d %H:%M:%S')

    if microwave_on:
        blackboard['microwave_was_on'] = True
        blackboard.pop('microwave_off_time', None)
    elif blackboard.get('microwave_was_on'):
        if door_open:
            blackboard.pop('microwave_was_on', None)
            blackboard.pop('microwave_off_time', None)
        else:
            if 'microwave_off_time' not in blackboard:
                blackboard['microwave_off_time'] = current_time
            elif current_time - blackboard['microwave_off_time'] >= timedelta(minutes=1):
                blackboard.pop('microwave_was_on', None)
                blackboard.pop('microwave_off_time', None)
                return True
    return False

# Wash hands after eating
# {
#   "task": "Wash hands after eating",
#   "date": "today",
#   "time": {
#     "exact_time": {
#       "start_time": null,
#       "end_time": null
#     },
#     "time_inferred": "after eating"
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
def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activtity') == "Eating" and activity_data.get('status') == "end"

# Remind to do laundry after breakfast
# {
#   "task": "Do laundry",
#   "date": null,
#   "time": {
#     "exact_time": {
#       "start_time": "09:00",
#       "end_time": "10:00"
#     },
#     "time_inferred": "after breakfast"
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
def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activtity') == "Eating" and activity_data.get('status') == "end"