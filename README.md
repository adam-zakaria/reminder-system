### How it Works
The creation of the notes can be done through two avenues:
#### Sensor route
1. PeoplePower sensor detect cabinets opening
2. The PeoplePower Bot associated with the host makes a HTTP call to the HTTP server
    * Note the address is hard coded in the bot
3. The HTTP server process the request and if its match the house/equipment in the configuration file `config.yaml`, sends the request to the websocket server.
4. The websocket server then sends the notes/request to the iOS application.
    * The iOS application needs to be connected to the websocket server BEFORE the event for the note to show.
5. The iOS application will then display the information.
#### Wizard route
1. First the wizard interface website must be deployed on the website. The address to the websocket server is hardcoded.
2. Open the wizard interface website and you will see the control interface 
![The wizard interface, showing fix commands, custom command, and delete command](<Resources /interface.png>)
3. Send any notes and the it will show on the iOS application.
4. The iOS application will then display the information.

### Order to start the programs
1. Websocket Server - can run indefinitely
2. PeoplePower Server - can run indefinitely
3. iOS application