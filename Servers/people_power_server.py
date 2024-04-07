from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import websocket
import json
import asyncio


connected_to_primary = False
last_msg = None

def on_message(ws, message):
    print(message)
    global connected_to_primary, last_msg
    last_msg = message
    if not connected_to_primary and json.loads(message).get('response', '') == 'success':
        print("connected to primary!")
        connected_to_primary = True

def on_error(ws, error):
    global connected_to_primary
    connected_to_primary = False
    print(error)

def on_close(ws, close_status_code, close_msg):
    global connected_to_primary
    connected_to_primary = False
    print("### closed ###")

def on_open(ws: websocket.WebSocketApp):
    ws.send(json.dumps({
        'type': 'init',
        'secret': 'MfEvLs8nM6YJLv8cT4hmz5Cyc92ZXyZu',
        'role': 'primary'
    }))    


ws = websocket.WebSocketApp("ws://localhost:36452",
                            on_open=on_open,
                            on_message=on_message,
                            on_error=on_error,
                            on_close=on_close)

import threading
t1 = threading.Thread(target=ws.run_forever)
t1.start()

VALIDATION_TOKEN = "BJuaLfEHHiubYf565zjwU8bKisEiQoTF"

import yaml
config = yaml.safe_load(open('config.yaml', 'r'))

house_state = {}
import typing
house_trigger : typing.Dict[str, typing.Dict[str, asyncio.Task]] = {}
house_trigger = {}

app = FastAPI()
class EquipmentStatus(BaseModel):
    home_key: str
    equipment_key: str
    status: str
    secret_token: str

@app.get("/")
async def root():
    return {"message": "Active"}

@app.get("/ping")
async def root():
    print("received ping")
    return {"message": "Active"}


async def check_before_send(home_key, equipment_key, sleep_time = 5, equipment_name = 'Fridge'):
    # wait for sleep time
    await asyncio.sleep(sleep_time)
    # check if the house state is still the same
    print("checking status")
    if house_state[home_key][equipment_key] == 'open':
        # check 
        print("object still open.. sending note")
        # global send_msg
        if (connected_to_primary):
            try:
                home_sys_key = config['home_key_map'][home_key]
            except KeyError:
                return {"message": "unkown house key"}
            ws.send(json.dumps({
            'type': 'send',
            'home_key': home_sys_key,
            'id': f'{equipment_name}-open',
            'message': {
                'title':f'Close {equipment_name.capitalize()}',
                'content':f'{equipment_name.capitalize()} is open. Please close the {equipment_name}.',
                'instructions': []
            }
        }))
        print("note sent!")


@app.get("/update/{home_key}/{equipment_key}")
async def update(home_key: str, equipment_key: str, status: str, secret_token: str):

    if secret_token != VALIDATION_TOKEN:
        return {"message": "Invalid token"}

    # update house state
    if home_key not in house_state:
        house_state[home_key] = {}
    house_state[home_key][equipment_key] = status

    try:
        equipment_name = config['equipment_key_name_pair'][home_key][equipment_key]
    except (KeyError, TypeError):
        print(f"unkown equipment or house key - {home_key} {equipment_key}")
        return {"message": "unkown equipment or house key"} 

    if status == 'open':
        if home_key not in house_trigger:
            house_trigger[home_key] = {}
        # check if an action is already running
        if equipment_key in house_trigger[home_key] and not house_trigger[home_key][equipment_key].done():
            house_trigger[home_key][equipment_key].cancel()
            del house_trigger[home_key][equipment_key]
        # start a new 5 second timer
        act = asyncio.create_task(check_before_send(home_key, equipment_key, equipment_name=equipment_name))
        house_trigger[home_key][equipment_key] = act
    else:
        if home_key in house_trigger and equipment_key in house_trigger[home_key]:
            if not house_trigger[home_key][equipment_key].done():
                house_trigger[home_key][equipment_key].cancel()
                del house_trigger[home_key][equipment_key]
            else:
                # send remove message
                print("sending remove data")
                global send_msg
                if (connected_to_primary):
                    try:
                        home_sys_key = config['home_key_map'][home_key]
                    except KeyError:
                        return {"message": "unkown house key"}
                    ws.send(json.dumps({
                        'type': 'remove',
                        'home_key': home_sys_key,
                        'id': f'{equipment_name}-open'
                    }))
    return {"message": "success"}