import json
import time
import logging
import signal
import sys
import requests
import paho.mqtt.client as mqtt

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# MQTT broker details
BROKER_ADDRESS = "192.168.0.74"
PORT = 1883
TOPIC = "activity_state"
LOG_FILE = 'activity.json'
FORMATTED_LOG_FILE = 'Formatted_activity.json'
SERVER_URL = "http://localhost:7628/oracle-updates"

# State to keep track of the current activity
activity_state = {
    "current_activity": None,
    "status": "end",
    "previous_activity": None
}

# Function to transform the response data
def transform_data(data, status):
    return {
        "update": {
            "activity": data["activity"],
            "house_id": "AH",
            "activity_status": status
        }
    }

# Function to log incoming activities in a valid JSON format
def log_activity(activity):
    try:
        if not activity:
            return
        with open(LOG_FILE, 'r+') as f:
            try:
                activities = json.load(f)
            except json.JSONDecodeError:
                activities = []
            activities.append(activity)
            f.seek(0)
            json.dump(activities, f, indent=4)
        logging.info(f'Logged activity: {activity}')
    except IOError as e:
        logging.error(f'Error logging activity: {e}')

# Function to log formatted activities sent to oracle-updates in a valid JSON format
def log_formatted_activity(activity):
    try:
        if not activity:
            return
        with open(FORMATTED_LOG_FILE, 'r+') as f:
            try:
                formatted_activities = json.load(f)
            except json.JSONDecodeError:
                formatted_activities = []
            formatted_activities.append(activity)
            f.seek(0)
            json.dump(formatted_activities, f, indent=4)
        logging.info(f'Logged formatted activity: {activity}')
    except IOError as e:
        logging.error(f'Error logging formatted activity: {e}')

# Function to send data to the server
def send_to_server(data):
    try:
        response = requests.post(SERVER_URL, json=data)
        response.raise_for_status()
        logging.info(f'Successfully sent to server: {data}')
    except requests.exceptions.RequestException as e:
        logging.error(f'Error sending data to server: {e}')

# MQTT callbacks
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logging.info("Connected to MQTT Broker!")
        client.subscribe(TOPIC)
    else:
        logging.error(f"Failed to connect, return code {rc}")

def on_message(client, userdata, msg):
    global activity_state
    try:
        incoming_data = json.loads(msg.payload.decode())
        log_activity(incoming_data)
        next_activity = incoming_data.get("activity")
        if next_activity and activity_state["current_activity"] != next_activity:
            # Send 'end' status for the current activity if it exists
            if activity_state["current_activity"] is not None:
                transformed_data = transform_data({"activity": activity_state["current_activity"]}, "end")
                log_formatted_activity(transformed_data)
                send_to_server(transformed_data)
                
                # Short delay before sending the next activity start
                time.sleep(1)
            
            # Send 'begin' status for the new activity
            transformed_data = transform_data({"activity": next_activity}, "begin")
            activity_state["current_activity"] = next_activity
            activity_state["status"] = "begin"
            activity_state["previous_activity"] = next_activity
            
            log_formatted_activity(transformed_data)
            send_to_server(transformed_data)
    except json.JSONDecodeError as e:
        logging.error(f'Error decoding JSON: {e}')

def send_data_on_change():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(BROKER_ADDRESS, PORT, 60)
    client.loop_forever()

# Graceful shutdown handler
def signal_handler(sig, frame):
    logging.info('Stopping the script.')
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    send_data_on_change()
