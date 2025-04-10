# Install packages
pipenv shell
pipenv install

# Activate venv (required to run) (if not already active)
pipenv shell

# Run
cd ../
python mvp.py --test mvp/sensor_json/sample_mqtt_messages.json