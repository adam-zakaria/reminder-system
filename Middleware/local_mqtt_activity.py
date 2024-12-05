import json
import requests
import time
import logging
import signal
import sys
import paho.mqtt.client as mqtt

# Configure logging to file
logging.basicConfig(filename='local-activity-demo.log', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# URL to send the data to
SERVER_URL = "http://localhost:7628/oracle-updates"

# MQTT Broker details
BROKER_ADDRESS = "192.168.0.74"
PORT = 1883
TOPIC = "activity_state"

# State to keep track of the current activity
activity_state = {
    "current_activity": None,
    "status": "end",
    "previous_activity": None,
    "repeat_count": 0,
    "activity_index": 0
}

activities = []

logging.info(f'Initial activity state: {activity_state}')

# Function to transform the response data
def transform_data(data, status):
    logging.info(f'Transforming data: {data} with status: {status}')
    return {
        "update": {
            "activity": data["activity"],
            "house_id": "AH",
            "activity_status": status
        }
    }

# Function to handle activity change and send data to the server
def handle_activity_change(activity):
    global activity_state

    if activity_state["current_activity"] != activity["activity"]:
        activity_state["current_activity"] = activity["activity"]
        activity_state["repeat_count"] = 1
        logging.info(f'Activity detected: {activity["activity"]} is different from current activity: {activity_state["current_activity"]}')
        logging.info(f'Current activity set to {activity["activity"]}, repeat count set to 1')
    else:
        activity_state["repeat_count"] += 1
        logging.info(f'Repeat count incremented to {activity_state["repeat_count"]} for activity {activity_state["current_activity"]}')

    if activity_state["repeat_count"] > 3:
        if activity_state["previous_activity"] != activity_state["current_activity"]:
            if activity_state["previous_activity"] is not None:
                transformed_data = transform_data({"activity": activity_state["previous_activity"]}, "end")
                logging.info(f'Sending end data to server: {transformed_data}')
                try:
                    response = requests.post(SERVER_URL, json=transformed_data)
                    response.raise_for_status()
                    logging.info(f'Successfully sent end data: {transformed_data}')
                except requests.exceptions.RequestException as e:
                    logging.error(f'Error sending end data: {e}')

            transformed_data = transform_data(activity, "begin")
            logging.info(f'Sending begin data to server: {transformed_data}')
            activity_state["previous_activity"] = activity["activity"]
            activity_state["current_activity"] = activity["activity"]
            activity_state["repeat_count"] = 0

            try:
                response = requests.post(SERVER_URL, json=transformed_data)
                response.raise_for_status()
                logging.info(f'Successfully sent begin data: {transformed_data}')
            except requests.exceptions.RequestException as e:
                logging.error(f'Error sending begin data: {e}')

# MQTT callback for when a message is received
def on_message(client, userdata, message):
    logging.info(f'Message received: {message.payload.decode()}')
    try:
        activity = json.loads(message.payload.decode())
        logging.info(f'Activity updated from MQTT message: {activity}')
        if 'activity' in activity:
            handle_activity_change(activity)
        else:
            logging.error('Received invalid activity data from MQTT message')
    except json.JSONDecodeError as e:
        logging.error(f'Error decoding JSON from MQTT message: {e}')

# MQTT callback for when the client connects to the broker (for MQTT v5)
def on_connect(client, userdata, flags, reason_code, properties):
    logging.info(f'Connected to MQTT broker with result code {reason_code}')
    client.subscribe(TOPIC)
    logging.info(f'Subscribed to topic: {TOPIC}')

# Graceful shutdown handler
def signal_handler(sig, frame):
    logging.info('Stopping the script.')
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    logging.info('Starting the script.')

    # Set up MQTT client with the latest API
    mqtt_client = mqtt.Client(client_id="", protocol=mqtt.MQTTv5)
    mqtt_client.on_connect = on_connect
    mqtt_client.on_message = on_message

    mqtt_client.connect(BROKER_ADDRESS, PORT, 60)
    mqtt_client.loop_start()

    # Keep the main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        logging.info('Script interrupted by user.')
        mqtt_client.loop_stop()
        sys.exit(0)
