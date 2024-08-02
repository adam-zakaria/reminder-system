import json
import requests
import time

# Path to the JSON file
json_file_path = 'mock.json'

# URL to send the data to
url = 'http://localhost:7628/oracle-updates'

def send_data_continuously():
    while True:
        # Load data from JSON file
        with open(json_file_path, 'r') as file:
            data = json.load(file)

        # Iterate through each element in the data array
        for element in data:
            try:
                # Send a POST request with the current element
                response = requests.post(url, json=element)
                response.raise_for_status()  # Check if the request was successful
                print(f'Successfully sent: {element}')
            except requests.exceptions.RequestException as e:
                print(f'Error sending data: {e}')
            
            # Wait for 3 seconds before sending the next element
            time.sleep(5)

if __name__ == "__main__":
    send_data_continuously()
