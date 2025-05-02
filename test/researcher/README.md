# Introduction
Run the reminder system with pregenerated state machines

Populate selected_state_machines.json with state machines. A list of 20 state machines already exist in all_state_machines.json, feel free to use these, but beware, the generated code does not necessarily work :)

# Run
```
cd $PROJECT_ROOT/bots/
pipenv shell
python mvp_main.py --test mvp/sensor_json/sample_mqtt_messages.json --state_machines /home/ubuntu/code/reminder-system/test/researcher/selected_state_machines.json
```