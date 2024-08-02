# mqtt_realtimedata_publisher.py

import paho.mqtt.client as mqtt
import json
import random
import time

# List of valid activities
activities = [
    'Relax', 'Meal_Preparation', 'Leave_Home', 'Sleeping',
    'Eating', 'Bed_To_Toilet', 'Enter_Home', 'Other'
]

# MQTT Broker details
broker = 'localhost'
port = 1883
topic = 'home/activity'

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")

def publish_activity(client, activity_name):
    # Create the message payload
    payload = json.dumps({"activity": activity_name})
    # Publish the message to the specified topic
    client.publish(topic, payload)
    print(f"Published: {payload} to topic: {topic}")

def simulate_event():
    # Simulate an event by selecting an activity
    activity_name = random.choice(activities)
    return activity_name

def main():
    # Create an MQTT client instance
    client = mqtt.Client()
    client.on_connect = on_connect

    # Connect to the broker
    client.connect(broker, port, 60)

    # Start the loop
    client.loop_start()

    try:
        while True:
            # Simulate waiting for an event to happen
            wait_time = random.uniform(1, 10)  # Random wait time between 1 and 10 seconds
            time.sleep(wait_time)

            # Simulate an event and publish the activity
            activity_name = simulate_event()
            publish_activity(client, activity_name)
    except KeyboardInterrupt:
        print("Disconnected from the broker")
    finally:
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    main()
