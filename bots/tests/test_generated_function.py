import datetime
from datetime import timedelta

def reminder_7c74a1b7_20be_412f_808d_415b96e718dc(time=None, activity_data=None, sensor_data=None, blackboard=None):
  return time and blackboard and activity_data.get('activity') == "Eating" and activity_data.get('status') == "end" and (blackboard.setdefault('breakfast_end_time', time) or True) and (time >= blackboard['breakfast_end_time'] + timedelta(hours=2))

reminder_7c74a1b7_20be_412f_808d_415b96e718dc(time=datetime.datetime.now(), activity_data={"activity": "Eating", "status": "end"}, sensor_data=None, blackboard=None)