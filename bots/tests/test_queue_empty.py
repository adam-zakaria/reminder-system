import sys

sys.path.append('/Users/azakaria/Code/neu/reminder-system/bots/mvp/mqtt_client')
from subscribe import sensor_update_queue

sensor_update_queue.put("test message")

if not sensor_update_queue.empty():
    print(sensor_update_queue.get())
else:
    print("Queue is empty")