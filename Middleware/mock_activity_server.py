import json
import requests
import time
import logging
import signal
import sys

# Configure logging to file
logging.basicConfig(filename='activity.log', level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# URL to send the data to
SERVER_URL = "http://localhost:4005/activity/"

# Load activity data from the JSON file
with open('test_data.json') as f:
    activities = json.load(f)
    logging.info('Loaded activities from activity.json')

# State to keep track of the current activity
activity_state = {
    "current_activity": None,
    "status": "end",
    "previous_activity": None,
    "repeat_count": 0,
    "activity_index": 0
}

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

# Function to determine the next activity from the activities list
def get_next_activity():
    global activity_state
    next_activity = activities[activity_state["activity_index"]]
    logging.info(f'Next activity chosen: {next_activity}')
    activity_state["activity_index"] = (activity_state["activity_index"] + 1) % len(activities)
    return next_activity

# Function to send data to the server when there is a change in activity
def send_data_on_change():
    global activity_state
    while True:
        next_activity = get_next_activity()

        if activity_state["current_activity"] != next_activity["activity"]:
            activity_state["current_activity"] = next_activity["activity"]
            activity_state["repeat_count"] = 1
            logging.info(f'Activity detected: {next_activity["activity"]} is different from current activity: {activity_state["current_activity"]}')
            logging.info(f'Current activity set to {next_activity["activity"]}, repeat count set to 1')
        else:
            activity_state["repeat_count"] += 1
            logging.info(f'Repeat count incremented to {activity_state["repeat_count"]} for activity {activity_state["current_activity"]}')

        if activity_state["repeat_count"] > 4:
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

                transformed_data = transform_data(next_activity, "begin")
                logging.info(f'Sending begin data to server: {transformed_data}')
                activity_state["previous_activity"] = next_activity["activity"]
                activity_state["current_activity"] = next_activity["activity"]
                activity_state["repeat_count"] = 0

                try:
                    print(transformed_data,"transformed data")
                    response = requests.post(SERVER_URL, json=transformed_data)
                    response.raise_for_status()
                    logging.info(f'Successfully sent begin data: {transformed_data}')
                except requests.exceptions.RequestException as e:
                    logging.error(f'Error sending begin data: {e}')

        time.sleep(1)

# Graceful shutdown handler
def signal_handler(sig, frame):
    logging.info('Stopping the script.')
    sys.exit(0)

if __name__ == "__main__":
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    logging.info('Starting the script.')
    send_data_on_change()
