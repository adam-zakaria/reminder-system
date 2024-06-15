import fetch from 'node-fetch';

const PORT = 7628; // Assuming your Node.js server runs on port 3000
const SERVER_URL = `http://localhost:${PORT}/oracle-updates`;

const activity_json = {
    "house_id" : "house_1",
    "timestamp": "2024-06-11T20:04:03",
    "device_id": "0015BC001A0115D3",
    "activity_status": "begin",
    "sensor_type": "motionStatus",
    "sensor_status": 1,
    "spec_location":"",
    "location": "loc-entry_hall_1",
    "activity": "cooking"
  }


function sendDummyUpdate() {
    // Updated dummy JSON structure to include targetClientId
    const dummyJson = {
        "update": { // Wrap the original payload under "update"
            "home_utilities": [
                {
                    "home_id": "home123",       //awarehome (static for now)
                    "utilities": [
                        {
                            "utility_id": "utility456", //sensor id
                            "utility_name": "Microwave", //map sensor id to utility name can be microwave
                            "status": "On", // 
                            "components": [
                                {
                                    "component_name": "Door",   // sensor name
                                    "status": "Closed"          //sensor status
                                }
                                // Additional components can be added as needed
                            ]
                        },
                        {
                            "utility_id": "utility789",
                            "utility_name": "Fridge",
                            "status": "On",
                            "components": [
                                {
                                    "component_name": "Door",
                                    "status": "Closed"
                                }
                                // Additional components can be added as needed
                            ]
                        }
                        // Additional utilities can be added as needed
                    ],
                    "activities": [
                        {
                            "activity_id": "activity789",
                            "activity_type": "Cooking",
                            "status": "Started"
                        }
                        // Additional activities can be added as needed
                    ]
                }
                // Additional home_utilities can be added as needed
            ]
        }
    };

    // Send the updated dummy JSON to the Node.js server
    fetch(SERVER_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        //body: JSON.stringify(dummyJson),
        body: JSON.stringify(activity_json),
    })
    .then(response => response.json())
    .then(data => console.log('Oracle update sent:', data))
    .catch((error) => console.error('Error sending update from Oracle:', error));
}



// Send the first update immediately
sendDummyUpdate();

// Send updates every minute
//setInterval(sendDummyUpdate, 10000); // 60000 milliseconds = 1 minute
