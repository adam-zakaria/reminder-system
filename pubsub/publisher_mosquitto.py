import subprocess
import json

def publish_message():
    # Load data from JSON file
    with open('sensor_data.json', 'r') as f:
        data = json.load(f)

    # Convert data to string format for publishing
    message = json.dumps(data)

    cmd = "\"C:\\Program Files\\mosquitto\\mosquitto_pub.exe\" -t testTopic -m \"{}\"".format(message)
    process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()

    if process.returncode == 0:
        print("Message published successfully.")
    else:
        print("Failed to publish message.")
        print("Error:\n", stderr.decode())

publish_message()
