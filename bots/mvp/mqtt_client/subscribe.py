# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0.

from awscrt import mqtt, http
from awsiot import mqtt_connection_builder
import sys
import threading
import time
import json
import queue
import os
import re
import argparse
# from utils.command_line_utils import CommandLineUtils

# Add path to project root for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Certificate paths - certs exist directly in the mqtt_client directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# AI Caring AWS account
CLIENT_ID = "aicaring-har-client"  # this can be anything as long as it is unique per connected device
ENDPOINT = "a833xidloo6xf-ats.iot.us-east-1.amazonaws.com"
PATH_TO_CERTIFICATE = os.path.join(SCRIPT_DIR, "d524cdc97038cb86e93a3421bc4242fbad2023e0ea2d67fdcaf0e3f6a10b6f85-certificate.pem.crt")
PATH_TO_PRIVATE_KEY = os.path.join(SCRIPT_DIR, "d524cdc97038cb86e93a3421bc4242fbad2023e0ea2d67fdcaf0e3f6a10b6f85-private.pem.key")
PATH_TO_AMAZON_ROOT_CA_1 = os.path.join(SCRIPT_DIR, "AmazonRootCA1.pem")

TOPIC_HOME_ID = "132"  # change to specific home id when needed
TOPIC = "aichome/aicaring-home-" + TOPIC_HOME_ID + "/source_mqtt/orcatech"

# Global message queue for the generator
sensor_update_queue = queue.Queue()

# event_loop_group = io.EventLoopGroup(1)
# host_resolver = io.DefaultHostResolver(event_loop_group)
# client_bootstrap = io.ClientBootstrap(event_loop_group, host_resolver)

# This sample uses the Message Broker for AWS IoT to send and receive messages
# through an MQTT connection. On startup, the device connects to the server,
# subscribes to a topic, and begins publishing messages to that topic.
# The device should receive those same messages back from the message broker,
# since it is subscribed to that same topic.
\
received_count = 0
received_all_event = threading.Event()
global msgOrder
msgOrder = 0

# Callback when connection is accidentally lost.
def on_connection_interrupted(connection, error, **kwargs):
    print("Connection interrupted. error: {}".format(error), flush=True)

# Callback when an interrupted connection is re-established.
def on_connection_resumed(connection, return_code, session_present, **kwargs):
    print("Connection resumed. return_code: {} session_present: {}".format(return_code, session_present), flush=True)

    if return_code == mqtt.ConnectReturnCode.ACCEPTED and not session_present:
        print("Session did not persist. Resubscribing to existing topics...", flush=True)
        resubscribe_future, _ = connection.resubscribe_existing_topics()

        # Cannot synchronously wait for resubscribe result because we're on the connection's event-loop thread,
        # evaluate result with a callback instead.
        resubscribe_future.add_done_callback(on_resubscribe_complete)


def on_resubscribe_complete(resubscribe_future):
    resubscribe_results = resubscribe_future.result()
    print("Resubscribe results: {}".format(resubscribe_results), flush=True)

    for topic, qos in resubscribe_results['topics']:
        if qos is None:
            sys.exit("Server rejected resubscribe to topic: {}".format(topic))


# Callback when the subscribed topic receives a message
def on_message_received(topic, payload, dup, qos, retain, **kwargs):
    #print("Received message from topic '{}':")

    s = payload.decode('utf-8')
    print(s)
    j = json.loads(s)

    global msgOrder    
    print(str(msgOrder) + ': message #' + j['payload']['uuid'] + ', '  + str(j['timestamp']))
    msgOrder = msgOrder + 1
    
    with open('captured.json', 'a') as writer:
        writer.write(payload.decode('utf-8'))
        writer.write(',\n')
    
    # Translate the message to reminder system format
    translated_data = translate_to_reminder_format(j)
    
    # Add the translated message to the queue for the generator
    sensor_update_queue.put(translated_data)

def translate_to_reminder_format(smart_home_data):
    """
    Translates data from smart_home_sensor_schema format to reminder_sensor_schema format.
    
    Args:
        smart_home_data (dict): Data in smart_home_sensor_schema format
        
    Returns:
        dict: Data in reminder_sensor_schema format
    """
    # Initialize the reminder schema structure
    reminder_data = {
        "location": {
            "homeId": smart_home_data.get("homeId", "unknown")
        }
    }
    
    # Extract metadata
    metadata = smart_home_data.get("metadata", {})
    location = metadata.get("location", "")
    location_parts = location.split("/")
    room = location_parts[-1] if len(location_parts) > 2 else "unknown"
    
    # Determine sensor type and extract values
    sensor_type = metadata.get("subtype", "").lower()
    value = metadata.get("value")
    
    # Map sensor types to reminder schema sensors
    if sensor_type == "motion":
        # Extract motion status from decoded field if available
        movement = False
        decoded = metadata.get("decoded", [])
        if decoded and isinstance(decoded, list) and len(decoded) > 0:
            movement = decoded[0].get("movement", False)
        
        # Determine which motion sensor based on room
        sensor_name = f"{room}_motion_sensor"
        reminder_data[sensor_name] = {
            "motion": movement,
            "last_motion": smart_home_data.get("timestamp"),
            "location": room
        }
    
    elif sensor_type == "contact":
        # Determine which entry sensor based on room
        if "door" in location.lower():
            sensor_name = "main_door_entry_sensor"
        elif "microwave" in location.lower():
            sensor_name = "microwave_door_entry_sensor"
        elif "fridge" in location.lower():
            sensor_name = "fridge_entry_sensor"
        else:
            sensor_name = f"{room}_entry_sensor"
            
        reminder_data[sensor_name] = {
            "status": value == 1 if isinstance(value, int) else False,
            "location": room
        }
    
    elif sensor_type == "temperature":
        sensor_name = f"{room}_temp_humidity_sensor"
        reminder_data[sensor_name] = {
            "temp": value,
            "location": room
        }
        
    elif sensor_type == "humidity":
        sensor_name = f"{room}_temp_humidity_sensor"
        # If sensor already exists, update it
        if sensor_name in reminder_data:
            reminder_data[sensor_name]["humidity"] = value
        else:
            reminder_data[sensor_name] = {
                "humidity": value,
                "location": room
            }
    
    elif sensor_type == "presence" or "presence" in location.lower():
        if "bed" in location.lower():
            sensor_name = "master_bedroom_bed_sensor"
            reminder_data[sensor_name] = {
                "presence": value == 1 if isinstance(value, int) else False,
                "location": "master_bedroom"
            }
        else:
            room_match = re.search(r'([a-z_]+)_occupancy', location.lower())
            room_name = room_match.group(1) if room_match else room
            reminder_data[f"{room_name}_occupancy"] = value == 1 if isinstance(value, int) else False
    
    # Add more sensor type mappings as needed
    
    return reminder_data

# Callback when the connection successfully connects
def on_connection_success(connection, callback_data):
    assert isinstance(callback_data, mqtt.OnConnectionSuccessData)
    print("Connection Successful with return code: {} session present: {}".format(callback_data.return_code, callback_data.session_present))

# Callback when a connection attempt fails
def on_connection_failure(connection, callback_data):
    assert isinstance(callback_data, mqtt.OnConnectionFailureData)
    print("Connection failed with error code: {}".format(callback_data.error))

# Callback when a connection has been disconnected or shutdown successfully
def on_connection_closed(connection, callback_data):
    print("Connection closed")

def load_test_data(file_path):
    """
    Load test data from a JSON file.
    
    Args:
        file_path (str): Path to the JSON file with test messages
        
    Returns:
        list: List of message objects
    """
    try:
        with open(file_path, 'r') as f:
            # Check if file is a JSON array or individual JSON objects separated by commas
            content = f.read().strip()
            
            # If not starting with [, wrap in array brackets
            if not content.startswith('['):
                content = '[' + content + ']'
                
            # Clean up trailing commas which are invalid in JSON
            content = content.replace(',]', ']')
            
            # Parse the JSON
            return json.loads(content)
    except Exception as e:
        print(f"Error loading test data: {e}")
        return []

def run_test_mode(test_file):
    """
    Run in test mode using a JSON file instead of MQTT messages.
    
    Args:
        test_file (str): Path to the JSON file with test messages
    """
    
    # Load test data
    test_messages = load_test_data(test_file)
    if not test_messages:
        print("No test messages found or error loading file")
        return
    
    # Process each message
    for i, message in enumerate(test_messages):
        print(f"Receiving sensor message {i+1}/{len(test_messages)}")
        
        # Translate the message to reminder system format
        translated_data = translate_to_reminder_format(message)
        
        # Add to queue
        sensor_update_queue.put(translated_data)
        
        # Save the translated message to a file for inspection
        with open('translated_test_data.json', 'a') as f:
            f.write(json.dumps(translated_data, indent=2))
            f.write(',\n')
        
        # Pause between messages for realistic simulation
        time.sleep(0.5)
    
    print("All sensor messages have been queued")

def subscribe_to_sensors(test=False, test_file=None):
    """
    Subscribe to sensor updates, either from MQTT or from a test file.
    
    Args:
        test (bool): If True, run in test mode using the provided test_file
        test_file (str): Path to the test file when running in test mode
        
    Returns:
        generator: Generator function that yields sensor updates as they arrive
    """
    if test:
        if not test_file:
            raise ValueError("test_file must be specified when test=True")
        # Run test mode in a thread so it doesn't block

        print(f"Running test mode in thread, reading from: {test_file}")
        thread = threading.Thread(target=run_test_mode, args=(test_file,), daemon=True)
        thread.start()
    else:
        # Normal MQTT mode
        # Create the proxy options if the data is present in cmdData
        proxy_options = None
    
        # Create a MQTT connection from the command line data
        mqtt_connection = mqtt_connection_builder.mtls_from_path(
            endpoint=ENDPOINT,
            cert_filepath=PATH_TO_CERTIFICATE,
            pri_key_filepath=PATH_TO_PRIVATE_KEY,
            ca_filepath=PATH_TO_AMAZON_ROOT_CA_1,
            on_connection_interrupted=on_connection_interrupted,
            on_connection_resumed=on_connection_resumed,
            client_id=CLIENT_ID,
            clean_session=False,
            keep_alive_secs=30,
            http_proxy_options=proxy_options,
            on_connection_success=on_connection_success,
            on_connection_failure=on_connection_failure,
            on_connection_closed=on_connection_closed)
    
        print("Connecting to endpoint with client ID")
        connect_future = mqtt_connection.connect()
    
        # Future.result() waits until a result is available
        connect_future.result()
        print("Connected!")
    
        # Subscribe
        print("Subscribing to topic '{}'...".format(TOPIC))
        subscribe_future, packet_id = mqtt_connection.subscribe(
            topic=TOPIC,
            qos=mqtt.QoS.AT_LEAST_ONCE,
            callback=on_message_received)
    
        subscribe_result = subscribe_future.result()
        print("Subscribed with {}".format(str(subscribe_result['qos'])))
    
        # Start a keep-alive thread
        def keep_alive_thread():
            keep_alive_counter = 0
            while True:
                print(f"Server still running... [{keep_alive_counter}] - {time.strftime('%Y-%m-%d %H:%M:%S')}", flush=True)
                keep_alive_counter += 1
                time.sleep(60)  # Print message every 60 seconds
        
        thread = threading.Thread(target=keep_alive_thread, daemon=True)
        thread.start()
    
    # Generator function that yields new sensor updates as they arrive
    def sensor_updates():
        while True:
            # Wait for a message to be available in the queue, --test and normal will put messages in the queue
            sensor_update = sensor_update_queue.get()
            # Return the message to the consumer
            yield sensor_update
            # Mark the task as done
            sensor_update_queue.task_done()

    return sensor_updates()

if __name__ == '__main__':
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='MQTT Client for Reminder System')
    parser.add_argument('--test', type=str, help='Run in test mode with the specified JSON file')
    args = parser.parse_args()
    
    # Run the subscription based on command line arguments
    try:
        if args.test:
            # Test mode with the specified file
            updates = subscribe_to_sensors(test=True, test_file=args.test)
        else:
            # Normal MQTT mode
            updates = subscribe_to_sensors(test=False)
        
        # Process updates in standalone mode
        for update in updates:
            print(f"Sensor update: {json.dumps(update, indent=2)}")
    except KeyboardInterrupt:
        print("Subscription stopped by user")
