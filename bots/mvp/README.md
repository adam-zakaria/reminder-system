# Install packages
pipenv shell
pipenv install

# Activate venv (required to run) (if not already active)
pipenv shell

# Run
cd ../

## Sensor based reminder
python mvp.py --test mvp/sensor_json/sample_mqtt_messages.json
    #conversation = "Remind me to water the plants when I'm in the kitchen"

## Time reminder (empty json)
python mvp.py --test mvp/sensor_json/time_reminder.json
conversation = "Remind me to go to yoga at 12PM"

Okay...how to test both..?
My body.......hurts....
Let's get out an idea or two more.

It comes down to creating each reminder.
