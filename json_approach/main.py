import utils
from datetime import datetime
# Load the test.json file
test = utils.jl('test/11/trigger.json')
sensor_updates = test['sensor_updates']
reminders = test['reminders']

for sensor_update in sensor_updates: # process sensor data as it arrives
  for reminder in reminders: # process reminders every time a sensor update arrives
    if reminder['sequential_conditions'] == True:
      for condition in reminder['Conditions']:
        # simple case - comparison
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