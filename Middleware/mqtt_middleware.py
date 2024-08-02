import paho.mqtt.client as mqtt
import ssl
import logging
import json
import os
import pandas as pd
import requests

# Configure logging
log_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

# General log handler
log_handler = logging.FileHandler('general.log')
log_handler.setLevel(logging.INFO)
log_handler.setFormatter(log_formatter)

# Error log handler
error_log_handler = logging.FileHandler('error.log')
error_log_handler.setLevel(logging.ERROR)
error_log_handler.setFormatter(log_formatter)

# Response log handler
response_log_handler = logging.FileHandler('response.log')
response_log_handler.setLevel(logging.INFO)
response_log_handler.setFormatter(log_formatter)

# Configure root logger
logging.getLogger().setLevel(logging.DEBUG)
logging.getLogger().addHandler(log_handler)
logging.getLogger().addHandler(error_log_handler)
logging.getLogger().addHandler(response_log_handler)

# MQTT connection details
BROKER_ADDRESS = "a319kg23nuphna-ats.iot.us-east-1.amazonaws.com"
PORT = 8883
TOPIC = "aicaring-demo"
CAFILE = "./certs/AmazonRootCA1.pem"
CERTFILE = "./certs/d7832b7c3ebd4ac7c2fea7c0ee3918e64b45778dd0a53bd931df76aa7d64a0fa-certificate.pem.crt"
KEYFILE = "./certs/d7832b7c3ebd4ac7c2fea7c0ee3918e64b45778dd0a53bd931df76aa7d64a0fa-private.pem.key"
TLS_VERSION = ssl.PROTOCOL_TLSv1_2
MQTT_VERSION = mqtt.MQTTv5
OUTPUT_FILE = "sensor_data.json"
CONVERTED_OUTPUT_FILE = "Formatted_sensor_data.json"
CSV_FILE_PATH = './Data/cep_metadata_04-2024.csv'
SERVER_URL = "http://localhost:7628/oracle-updates"  # Server URL for sending data

# Load CSV data and create a device ID to description mapping
csv_data = pd.read_csv(CSV_FILE_PATH)
device_mapping = {}
for index, row in csv_data.iterrows():
    device_mapping[row['Digital Device ID'].replace(' ', '')] = {
        'utility_id': row['Digital Device ID'].replace(' ', ''),
        'utility_name': row['Device Name_Description'],
        'location_id': row['PPC location ID'],
        'status': 'Unknown',  # Default status
        'group': 'microwave' if 'microwave' in row['Device Name_Description'].lower() else 'unknown',  # Assign group
        'components': [
            {
                'component_name': row['Sensor Type'],
                'status': 'Unknown'  # Default status
            }
        ]
    }

def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        logging.info("Connected to MQTT Broker!")
        try:
            client.subscribe(TOPIC, qos=0)
        except Exception as e:
            logging.error(f"Failed to subscribe to topic {TOPIC}: {e}")
    else:
        logging.error(f"Failed to connect, return code {rc}")

def on_message(client, userdata, msg):
    message = msg.payload.decode()
    logging.info(f"Received message: {message}")
    try:
        data = json.loads(message)
    except json.JSONDecodeError as e:
        logging.error(f"Failed to decode JSON message: {e}")
        return

    device_id = data['data']['deviceId'].replace(' ', '')
    if device_id in device_mapping:
        device_info = device_mapping[device_id]
        device_info['status'] = 'On' if data['data']['value'] != "0" else 'Off'
        device_info['components'][0]['status'] = 'Updated' if data['data']['updated'] else 'Not Updated'

        response = {
            "update": {
                "home_utilities": [
                    {
                        "house_id": data['ident']['cepid'],
                        "utilities": [
                            {
                                "utility_id": device_info['utility_id'],
                                "utility_name": device_info['utility_name'],
                                "location": device_info['location_id'],
                                "status": device_info['status'],
                                "group": device_info['group'],
                                "components": [
                                    {
                                        "component_name": data['data']['name'],
                                        "status": device_info['components'][0]['status'],
                                        "value": data['data']['value'],
                                        "time": data['data']['time']
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        }

        try:
            existing_data = []
            if os.path.exists(OUTPUT_FILE):
                with open(OUTPUT_FILE, 'r') as f:
                    try:
                        existing_data = json.load(f)
                    except json.JSONDecodeError:
                        logging.error(f"Existing JSON file is corrupted. Creating a new one.")

            existing_data.append({
                "mqtt_message": data,
                "response": response
            })

            with open(OUTPUT_FILE, 'w') as f:
                json.dump(existing_data, f, indent=2)

            # Save the converted response in a separate file
            converted_data = []
            if os.path.exists(CONVERTED_OUTPUT_FILE):
                with open(CONVERTED_OUTPUT_FILE, 'r') as f:
                    try:
                        converted_data = json.load(f)
                    except json.JSONDecodeError:
                        logging.error(f"Existing converted JSON file is corrupted. Creating a new one.")

            converted_data.append(response)

            with open(CONVERTED_OUTPUT_FILE, 'w') as f:
                json.dump(converted_data, f, indent=2)

            # Send the formatted data to the server
            send_data_to_server(response)

        except Exception as e:
            logging.error(f"Failed to write message to JSON file: {e}")

def send_data_to_server(data):
    try:
        response = requests.post(SERVER_URL, json=data)
        response.raise_for_status()
        logging.info(f"Data sent to server: {response.status_code}")
    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to send data to server: {e}")

def on_subscribe(client, userdata, mid, granted_qos, properties=None):
    logging.info(f"Subscribed to topic {TOPIC} with QoS {granted_qos}")

def on_disconnect(client, userdata, rc, properties=None):
    if rc != 0:
        logging.warning("Unexpected disconnection.")
    else:
        logging.info("Disconnected from MQTT Broker.")

def main():
    client = mqtt.Client(client_id="", protocol=MQTT_VERSION)

    try:
        # Configure TLS connection
        client.tls_set(ca_certs=CAFILE, certfile=CERTFILE, keyfile=KEYFILE, tls_version=TLS_VERSION)
        client.tls_insecure_set(False)
    except ssl.SSLError as e:
        logging.error(f"SSL error: {e}")
        return

    # Assign event callbacks
    client.on_connect = on_connect
    client.on_message = on_message
    client.on_subscribe = on_subscribe
    client.on_disconnect = on_disconnect

    try:
        # Connect to broker
        client.connect(BROKER_ADDRESS, PORT)
    except Exception as e:
        logging.error(f"Failed to connect to broker: {e}")
        return

    # Start the loop
    try:
        client.loop_forever()
    except KeyboardInterrupt:
        logging.info("Program interrupted by user")
        client.disconnect()
    except Exception as e:
        logging.error(f"An error occurred: {e}")

if __name__ == "__main__":
    main()
