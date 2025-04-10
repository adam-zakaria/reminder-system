from mqtt_client.subscribe import subscribe_to_sensors
import argparse
import json
import sys
import os

# Resolve project paths
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, '../..'))
BOTS_DIR = os.path.join(REPO_ROOT, 'bots')
TESTS_DIR = os.path.join(BOTS_DIR, 'tests')
DATASTORE_DIR = os.path.join(REPO_ROOT, 'Datastore')

# Ensure Datastore directory exists
os.makedirs(DATASTORE_DIR, exist_ok=True)

# Create necessary paths that ChatAssistant expects
for filename in ['state_machines.json', 'sensor_mapping.json', 'activities.json']:
    filepath = os.path.join(DATASTORE_DIR, filename)
    if not os.path.exists(filepath):
        with open(filepath, 'w') as f:
            if filename == 'activities.json':
                f.write('{"activities": {"Meal_Preparation": true, "Sleeping": true, "Eating": true}}')
            else:
                f.write('{}')
        print(f"Created empty {filename} file")

# Add necessary paths to sys.path
sys.path.insert(0, REPO_ROOT)
sys.path.insert(0, BOTS_DIR)
sys.path.insert(0, TESTS_DIR)

# Create a monkeypatch for open() to fix path issues
original_open = open

def patched_open(file, *args, **kwargs):
    filepath = str(file)
    
    # Fix relative paths in ChatAssistant
    if filepath == os.path.join("..", "Datastore", "state_machines.json"):
        return original_open(os.path.join(DATASTORE_DIR, "state_machines.json"), *args, **kwargs)
    elif filepath == os.path.join("..", "Datastore", "sensor_mapping.json"):
        return original_open(os.path.join(DATASTORE_DIR, "sensor_mapping.json"), *args, **kwargs)
    elif filepath == os.path.join("..", "Datastore", "activities.json"):
        return original_open(os.path.join(DATASTORE_DIR, "activities.json"), *args, **kwargs)
    
    return original_open(filepath, *args, **kwargs)

# Apply the monkeypatch
open = patched_open

# Now we can import the test_az module
from tests import test_az

def display_banner():
    """Display a banner showing the application is running"""
    print("\n" + "=" * 50)
    print("Reminder System MVP".center(50))
    print("=" * 50)
    print(f"Repository Root: {REPO_ROOT}")
    print(f"Running from: {CURRENT_DIR}")
    print("-" * 50 + "\n")

if __name__ == "__main__":
    display_banner()
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Reminder System')
    parser.add_argument('--test', type=str, help='Run in test mode with the specified JSON file')
    args = parser.parse_args()
    
    try:
        # Start the sensor subscription
        if args.test:
            print(f"Running in test mode using file: {args.test}")
            updates = subscribe_to_sensors(test=True, test_file=args.test)
        else:
            print("Running in MQTT mode")
            updates = subscribe_to_sensors(test=False)
        
        # Process the sensor updates
        test_az.process_sensor_updates(updates)
    except KeyboardInterrupt:
        print("\nReminder system stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)