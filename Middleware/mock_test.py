# import json
# import requests
# import time

# # Path to the JSON file
# json_file_path = 'sensor_sequence.json'

# # URL to send the data to
# url = 'http://localhost:7628/oracle-updates'

# def send_data_continuously():
#     while True:
#         # Load data from JSON file
#         with open(json_file_path, 'r') as file:
#             data = json.load(file)

#         # Iterate through each element in the data array
#         for element in data:
#             try:
#                 # Send a POST request with the current element
#                 response = requests.post(url, json=element)
#                 response.raise_for_status()  # Check if the request was successful
#                 print(f'Successfully sent: {element}')
#             except requests.exceptions.RequestException as e:
#                 print(f'Error sending data: {e}')
            
#             # Wait for 3 seconds before sending the next element
#             time.sleep(0.5)
        
#         # Break the loop after all elements are sent
#         break

# if __name__ == "__main__":
#     send_data_continuously()
import json
import requests
import time

# Path to the JSON file
JSON_FILE_PATH = 'sensor_sequence.json'

# URL to send the data to
URL = 'http://localhost:7628/oracle-updates'

def load_json_data(file_path):
    """Load data from a JSON file."""
    try:
        with open(file_path, 'r') as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading JSON data: {e}")
        return []

def send_post_request(url, data):
    """Send a POST request to the given URL with the provided data."""
    try:
        response = requests.post(url, json=data)
        response.raise_for_status()
        print(f'Successfully sent: {data}')
    except requests.exceptions.RequestException as e:
        print(f'Error sending data: {e}')

def process_and_send_data(data, url):
    """Process the data and send entries with microwave utilities."""
    for element in data:
        updates = element.get('update', {}).get('home_utilities', [])
        for update in updates:
            utilities = update.get('utilities', [])
            for utility in utilities:
                if utility.get('group', '').lower() == 'microwave':
                    send_post_request(url, element)
                    time.sleep(0.5)
                    break
            else:
                continue
            break
        else:
            print(f'Ignored non-microwave data: {element}')

def send_data_continuously():
    """Continuously send data loaded from a JSON file."""
    while True:
        data = load_json_data(JSON_FILE_PATH)
        if data:
            for element in data:
                process_and_send_data([element], URL)
        else:
            print("No valid data to send.")
        
        # Break the loop after all elements are sent
        break

if __name__ == "__main__":
    send_data_continuously()
