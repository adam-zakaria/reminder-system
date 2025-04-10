import argparse
import json
import sys

# Import the path setup module - must be first import
from path_setup import initialize_environment

def main():
    # Initialize environment - sets up paths, creates files, and applies monkeypatches
    initialize_environment()
    
    # Now we can import our modules (after paths are set up)
    from mqtt_client.subscribe import subscribe_to_sensors
    from tests import test_az
    
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

if __name__ == "__main__":
    main()