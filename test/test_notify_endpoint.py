import requests
import json

# Define the server URL
url = "http://localhost:7628/notify"

# Define the payload
payload = {
    "clientId": "home123",
    "action": "add",
    "id": "test123",
    "stickyNote": {
        "title": "Test Note",
        "content": "This is a test.",
        "notificationSoundID": 1,
        "instructions": []
    }
}

# Send the request
response = requests.post(url, json=payload)

# Print the response
print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")
