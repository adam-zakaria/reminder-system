#!/usr/bin/env python

import asyncio
import websockets
import json
import multiprocessing


message_flag = asyncio.Event()
message_lock = asyncio.Lock()
message_stack = []
_loop = asyncio.get_event_loop()
message_queue = multiprocessing.Queue()

connected_clients = {}  # set()


async def client_handler(websocket: websockets.WebSocketServerProtocol, home_key: str):
    await websocket.send(json.dumps({
        'response': 'success'
    }))

    connected_clients[home_key] = websocket
    try:
        # keep open
        await websocket.wait_closed()
    finally:
        connected_clients.pop(home_key, None)


async def primary_handler(websocket):
    await websocket.send(json.dumps({
        'response': 'success'
    }))
    async for message in websocket:
        message = json.loads(message)
        if message['type'] == 'broadcast':
            # send to every single connected client
            broadcast_sockets = set(connected_clients.values())
            print(f"broadcasting to {json.dumps(message['message'])}")
            websockets.broadcast(broadcast_sockets, json.dumps({
                'action': 'add',
                'id': message['id'],
                'msg': message['message']
            }))
            await websocket.send(json.dumps({
                'response': 'success'
            }))

        elif message['type'] == 'send':
            home_key = message['home_key']
            if home_key in connected_clients:
                await connected_clients[home_key].send(json.dumps({
                    'action': 'add',
                    'id': message['id'],
                    'msg': message['message']
                }))
                await websocket.send(json.dumps({
                    'response': 'success-done'
                }))
            else:
                await websocket.send(json.dumps({
                    'response': 'no client with home key exist',
                }))

        elif message['type'] == 'remove':
            if 'home_key' in message and message['home_key'] != '':
                home_key = message['home_key']
                if home_key in connected_clients:
                    await connected_clients[home_key].send(json.dumps({
                        'action': 'remove',
                        'id': message['id'],
                    }))
                    await websocket.send(json.dumps({
                        'response': 'success'
                    }))
                else:
                    await websocket.send(json.dumps({
                        'response': 'no client with home key exist'
                    }))
            else:
                # broadcast to all clients
                broadcast_sockets = set(connected_clients.values())
                websockets.broadcast(broadcast_sockets, json.dumps({
                    'action': 'remove',
                    'id': message['id'],
                }))
                await websocket.send(json.dumps({
                    'response': 'success'
                }))


PRIMARY_SECRET = "MfEvLs8nM6YJLv8cT4hmz5Cyc92ZXyZu"
CLIENT_SECRET = "qyPDrj5yxq6rUHbwHbpTR8CXJVRFWRSU"


async def handler(websocket):

    # log connection and name
    print("connection from: ", websocket.remote_address)

    message = await websocket.recv()
    print(message)
    message = json.loads(message)

    # check connection
    if message.get('type', '') != 'init':
        print("invalid initial connection")
        return

    # check if primary or secondary
    if message.get('role', '') == 'primary':
        if message.get('secret', '') != PRIMARY_SECRET:
            print("invalid secret key")
            await websocket.send(json.dumps({
                    'response': 'invalid token'
                }))
            return
        await primary_handler(websocket)
    elif message.get('role', '') == 'client':
        if message.get('secret', '') != CLIENT_SECRET:
            print("invalid secret key")
            await websocket.send(json.dumps({
                    'response': 'invalid token'
                }))
            return
        await client_handler(websocket, message['home_key'])
    else:
        print("invalid role")
        return

    # async for message in websocket:
    #     print("connection from: ", websocket.remote_address)
    #     while True:
    #         input("press enter to send fridge message")
    #         await websocket.send(json.dumps({
    #             'title':'Close Fridge',
    #             'content':'Fridge is open. Please close the fridge.',
    #             'instructions': []
    #         }))
    #         input("press enter to send cleanup message")
    #         await websocket.send(json.dumps({
    #             'title':'Clean Up Kitchen',
    #             'content':'Put the bread, peanut butter, and jelly away.',
    #             'instructions': [
    #                 'Put the bread in the cabinet',
    #                 'Put the peanut butter in the cabinet',
    #                 'Put the jelly in the fridge'
    #             ]
    #         }))


async def main():
    async with websockets.serve(handler, "localhost", 36452):
        await asyncio.Future()  # run forever

print("starting server")
asyncio.run(main())
