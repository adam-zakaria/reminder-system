const chai = require('chai');
const chaiHttp = require('chai-http');
const { server, app } = require('../server');
const { expect } = chai;
//const { connectedClients } = require('../server');
const WebSocket = require('ws');

// Create a WebSocket.Server instance
const wss = new WebSocket.Server({ noServer: true });

let connectedClients = {};

chai.use(chaiHttp);

describe('Reminders', () => {
  let testServer;
  let clientWs;

  before((done) => {
    testServer = app.listen(7629, done);
    testServer.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });

    wss.on('connection', (ws, req) => {
      ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'init' && data.role === 'client') {
          const clientId = data.home_key; // assuming the clientId is in the message
          connectedClients[clientId] = ws;
        }
      });
    });

    // Server error log
    wss.on('error', (error) => {
      console.log(`Server error: ${error.message}`);
    });

    // Simulate a client connection
    clientWs = new WebSocket('ws://localhost:7629/');
    clientWs.on('open', () => {
      clientWs.send(JSON.stringify({
        "type": "init",
        "role": "client",
        "secret": "qyPDrj5yxq6rUHbwHbpTR8CXJVRFWRSU",
        "home_key": "home123"
      }));
    });

    // Client error log
    clientWs.on('error', (error) => {
      console.error(`WebSocket client error: ${error.message}`);
      done(error); // Call done with error to fail the test
    });
  });

  after((done) => {
    testServer.close();
    for (const ws of Object.values(connectedClients)) {
      ws.close();
    }
    done();
  });

  it('should create a reminder', (done) => {
    chai.request(app)
      .post('/reminders')
      .send({
        userId: 12345,
        message: 'Test Reminder',
        interval: '5m',
        time: '2024-04-14T19:30:00Z',
        utility_name: 'Fridge',
        component_name: 'Door',
        condition: 'open',
        display: 'true',
        delay: 60000
      })
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('userId', 12345);
        done(err);
      });
  });

  // it('should send a reminder to the device based on oracle updates', function (done) {
  //   this.timeout(4000);
  //   const dummyJson = {
  //     "update": {
  //       "home_utilities": [
  //         {
  //           "home_id": "home123",
  //           "utilities": [
  //             {
  //               "utility_id": "utility456",
  //               "utility_name": "Microwave",
  //               "status": "On",
  //               "components": [
  //                 {
  //                   "component_name": "Door",
  //                   "status": "Closed"
  //                 }
  //               ]
  //             },
  //             {
  //               "utility_id": "utility789",
  //               "utility_name": "Fridge",
  //               "status": "On",
  //               "components": [
  //                 {
  //                   "component_name": "Door",
  //                   "status": "Open"
  //                 }
  //               ]
  //             }
  //           ],
  //           "activities": [
  //             {
  //               "activity_id": "activity789",
  //               "activity_type": "Cooking",
  //               "status": "Started"
  //             }
  //           ]
  //         }
  //       ]
  //     }
  //   };

  //   chai.request(app)
  //     .post('/oracle-updates')
  //     .send({ update: dummyJson })
  //     .end((err, res) => {
  //       //console.log(res, "res")
  //       expect(res).to.have.status(200);
  //       //console.log("after res")
  //       expect(res.body).to.have.property('status', 'Update received');
  //       // console.log("after body")
  //       // Check if the message is sent to the device
  //       const clientId = 'home123';
  //       const message = {
  //         action: 'add',
  //         id: '123',
  //         msg: {
  //           id: '123',
  //           title: 'Test Reminder',
  //           content: 'Test Reminder',
  //           notificationSoundID: 1,
  //           instructions: []
  //         }
  //       };
  //       const clientWs = connectedClients[clientId];
  //       //console.log(clientWs, "clients")
  //       if (clientWs) {
  //         console.log(`Sending message to client: ${clientId}`);
  //         clientWs.once('message', (receivedMessage) => {
  //           console.log(`Received message from client: ${clientId}`);
  //           const parsedMessage = JSON.parse(receivedMessage);
  //           expect(parsedMessage).to.deep.equal(message);
  //           done();
  //         });


  //       } else {
  //         done(new Error(`Client ${clientId} is not connected`));
  //       }
  //     });
  // });
});