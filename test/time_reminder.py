import requests
import json
import datetime

# Load credentials from the .login_credentials file
try:
    with open('.login_credentials', 'r') as cred_file:
        credentials = json.load(cred_file)
except Exception as e:
    print("Error reading .login_credentials file:", e)
    exit(1)

# Validate that the credentials file contains the required keys
if 'email' not in credentials or 'password' not in credentials:
    print("The .login_credentials file must contain 'email' and 'password' keys.")
    exit(1)

# === Step 1: Log in to Obtain JWT Token ===
login_url = "http://localhost:7628/login"

print("Logging in...")
login_response = requests.post(login_url, json=credentials)

if login_response.status_code == 200:
    token = login_response.json().get("token")
    if not token:
        print("Login succeeded but no token was returned.")
        exit(1)
    print("Obtained JWT token:", token)
else:
    print("Login failed with status code:", login_response.status_code)
    print("Response:", login_response.text)
    exit(1)

# === Step 2: Create a Time-Based Reminder Using the Token ===
reminder_url = "http://localhost:7628/reminders"

# Calculate a future time (10 seconds from now, in UTC) using timezone-aware datetime
now = datetime.datetime.now(datetime.timezone.utc)
future_time = now + datetime.timedelta(seconds=10)
future_time_iso = future_time.isoformat()  # e.g., "2025-03-11T19:02:10+00:00"

# Build the reminder payload for a time-based reminder
payload = {
    "message": "Test Time-Based Reminder",
    "interval": "once",
    "time": future_time_iso,
    "utility_name": None,
    "component_name": None,
    "condition": None,
    "display": "Time-Based Reminder Test (10s delay)",
    "delay": None,
    "disappearOnCondition": False,
    "activity": None,
    "triggerTime": None,
    "triggerType": None,
    "lightCategoryId": 1
}

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {token}"
}

print("Sending reminder...")
reminder_response = requests.post(reminder_url, headers=headers, json=payload)
print("Reminder Status Code:", reminder_response.status_code)
try:
    print("Reminder Response:", reminder_response.json())
except Exception as e:
    print("Error decoding reminder response:", e)
