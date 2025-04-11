import argparse
import json
import sys
import os
from mvp.mqtt_client.subscribe import subscribe_to_sensors
from tests import test_az

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Reminder System')
    parser.add_argument('--test', type=str, help='Run in test mode with the specified JSON file')
    args = parser.parse_args()

    # (0) Create the reminder (state machine)
    #conversation = "Please remind me to look at the sticky notes when I'm in the office"
    conversation = "Remind me to water the plants when I'm in the kitchen"
    test_az.create_reminder(conversation)
    
    try:
        # (1) Get the sensor updates
        if args.test:
            print(f"Running in test mode using file: {args.test}")
            updates = subscribe_to_sensors(test=True, test_file=args.test)
        else:
            print("Running in MQTT mode")
            updates = subscribe_to_sensors(test=False)
        
        # (2) Process the sensor updates
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
    # (3) Observe sticky note creation in iOS app

if __name__ == "__main__":
    main()