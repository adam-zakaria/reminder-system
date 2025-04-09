import requests
import json

# Define the server URL
url = "http://localhost:7628/notify"

# Define the payload
payload = {
    #"clientId": "home123",
    "clientId": "ep6", # When the iOS app connects to the (node) backend, it will print the clientId
    "action": "add",
    "id": "test123",
    "stickyNote": {
        "title": "Test Note",
        "content": "This is a test.",
        "notificationSoundID": 1,
        "instructions": [],
        "lightCategoryId": 1  # Add this field inside stickyNote
    }
}

# Send the request
response = requests.post(url, json=payload)

# Print the response
print(f"Status Code: {response.status_code}")
print(f"Response: {response.json()}")
