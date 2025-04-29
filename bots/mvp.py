import argparse
import sys
import os
# Import config to load environment variables
import config
from mvp.mqtt_client.subscribe import subscribe_to_sensors
from tests import helpers

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Reminder System')
    parser.add_argument('--test', type=str, help='Run in test mode with the specified JSON file')
    args = parser.parse_args()

    # (0) Create the reminders (state machines)
    conversation = "Remind me to water the plants when I'm in the kitchen"
    # state_machines global is scoped to helpers.py - it works but is not good practice
    helpers.create_reminder(conversation)
    conversation = "Remind me to go to yoga at 12PM"
    helpers.create_reminder(conversation)
    
    try:
        # (1) Subscribe to sensor updates
        if args.test:
            print(f"Subscribing to sensors (test mode) in separate thread using test file: {args.test}")
            sensor_update_queue = subscribe_to_sensors(test=True, test_file=args.test)
        else:
            print("Running in MQTT mode")
            sensor_update_queue = subscribe_to_sensors(test=False)
        
        # (2) Execute state machines in an infinite loop
        helpers.execute_state_machines(sensor_update_queue)
    except KeyboardInterrupt:
        print("\nReminder system stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    # (3) Observe sticky note creation in iOS app

if __name__ == "__main__":
    main()