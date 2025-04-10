import argparse
import json
import sys
import os
import builtins
import time
import threading
import queue
from datetime import datetime

# Resolve project paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '../..'))
BOTS_DIR = os.path.join(REPO_ROOT, 'bots')
TESTS_DIR = os.path.join(BOTS_DIR, 'tests')
DATASTORE_DIR = os.path.join(REPO_ROOT, 'Datastore')

print(f"Repository Root: {REPO_ROOT}")
print(f"Datastore Dir: {DATASTORE_DIR}")

# Ensure Datastore directory exists
os.makedirs(DATASTORE_DIR, exist_ok=True)

# Create necessary paths that ChatAssistant expects
for filename in ['state_machines.json', 'sensor_mapping.json', 'activities.json']:
    filepath = os.path.join(DATASTORE_DIR, filename)
    if not os.path.exists(filepath):
        with builtins.open(filepath, 'w') as f:
            if filename == 'activities.json':
                f.write('{"activities": {"Meal_Preparation": true, "Sleeping": true, "Eating": true}}')
            else:
                f.write('{}')
        print(f"Created empty {filename} file")

# Add necessary paths to sys.path
sys.path.insert(0, REPO_ROOT)
sys.path.insert(0, BOTS_DIR)
sys.path.insert(0, TESTS_DIR)

# Store the original open function
original_open = builtins.open

# Create a monkeypatch for open() to fix path issues
def patched_open(file, *args, **kwargs):
    filepath = str(file)
    
    # Handle all variants of Datastore paths
    if '../Datastore/' in filepath or '../Datastore\\' in filepath:
        # Extract the filename from the path
        filename = os.path.basename(filepath)
        fixed_path = os.path.join(DATASTORE_DIR, filename)
        print(f"Redirecting '{filepath}' to '{fixed_path}'")
        return original_open(fixed_path, *args, **kwargs)
    
    return original_open(filepath, *args, **kwargs)

# Apply the monkeypatch to builtins.open before any imports
builtins.open = patched_open

# Now we can import our modules
from mqtt_client.subscribe import subscribe_to_sensors, sensor_update_queue, sensor_updates
from tests import test_az

def display_banner():
    """Display a banner showing the application is running"""
    print("\n" + "=" * 50)
    print("Reminder System MVP".center(50))
    print("=" * 50)
    print(f"Repository Root: {REPO_ROOT}")
    print(f"Running from: {CURRENT_DIR}")
    print("-" * 50 + "\n")

def generate_mock_sensor_data():
    """
    Generate mock sensor data for testing without MQTT or a test file
    """
    # Sample sensor data
    sample_sensors = [
        {
            "kitchen_motion_sensor": {
                "motion": True,
                "last_motion": datetime.now().isoformat(),
                "location": "kitchen"
            },
            "location": {
                "homeId": "123"
            }
        },
        {
            "main_door_entry_sensor": {
                "status": True,
                "location": "entryway"
            },
            "location": {
                "homeId": "123"
            }
        },
        {
            "living_room_temp_humidity_sensor": {
                "temp": 72.5,
                "humidity": 45.2,
                "location": "living_room"
            },
            "location": {
                "homeId": "123"
            }
        },
        {
            "master_bedroom_bed_sensor": {
                "presence": True,
                "location": "master_bedroom"
            },
            "location": {
                "homeId": "123"
            }
        }
    ]
    
    print("Starting mock sensor data generation...")
    
    # Generate each sensor reading with delays
    while True:
        for sensor_data in sample_sensors:
            # Put the data in the queue
            sensor_update_queue.put(sensor_data)
            print(f"Generated mock sensor data: {json.dumps(sensor_data, indent=2)}")
            
            # Wait between data points
            time.sleep(10)

if __name__ == "__main__":
    display_banner()
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Reminder System')
    parser.add_argument('--test', type=str, help='Run in test mode with the specified JSON file')
    parser.add_argument('--mock-mqtt', action='store_true', help='Run with mock MQTT data (no actual MQTT connection)')
    args = parser.parse_args()
    
    try:
        # Start the sensor subscription based on mode
        if args.test:
            print(f"Running in test mode using file: {args.test}")
            updates = subscribe_to_sensors(test=True, test_file=args.test)
        elif args.mock_mqtt:
            print("Running with mock MQTT data (no actual connection)")
            # Start mock data generator in a background thread
            mock_thread = threading.Thread(target=generate_mock_sensor_data, daemon=True)
            mock_thread.start()
            # Use the standard sensor_updates generator
            updates = sensor_updates()
        else:
            print("Running in MQTT mode")
            updates = subscribe_to_sensors(test=False)
        
        # Process the sensor updates
        print("Starting to process sensor updates...")
        test_az.process_sensor_updates(updates)
    except KeyboardInterrupt:
        print("\nReminder system stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)