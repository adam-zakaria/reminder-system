<p align="center">
  <img src="Resources/Northeastern-university-logo.svg" alt="Logo 1" width="200" height="100"/>
  <img src="Resources/AICaringLogo.png" alt="Logo 2" width="200" height="100"/>
</p>

# Aware Home Meal Prep Reminder Authoring System

- [ ] **Sensor Data Collection**
  - [ ] **Sensors**
    - [ ] Detect home events (e.g. door open/close, microwave on/off)
    - [ ] Send event status

- [ ] **Data Processing**
  - [ ] **Machine Learning Algorithms**
    - [ ] Classify and identify activities:
      - [ ] Bed_To_Toilet
      - [ ] Eating
      - [ ] Enter_Home
      - [ ] Leave_Home
      - [ ] Meal_Preparation
      - [ ] Relax
      - [ ] Sleep
      - [ ] Use_Bathroom
      - [ ] Work

- [ ] **Data Transmission**
  - [ ] **PubSub Pipeline**
    - [ ] Use Mosquitto message broker on local LAN
    - [ ] Utilize MQTT protocol
  - [ ] **Topics**
    - [ ] Activity Data (JSON format)
    - [ ] Utility Data (JSON format)

- [ ] **Data Subscription and Handling**
  - [ ] **App Server Subscribes to Topics**
    - [ ] Receive and process activity data
    - [ ] Receive and process utility data
  - [ ] **Event Tracking**
    - [X] Track reminders based on user conditions

- [X] **User Interaction**
  - [X] **Web Application**
    - [X] Create reminders based on:
      - [X] Time
      - [X] Utility
      - [X] Activity
    - [X] **AI Chat Assistant**
      - [X] Help create reminders using natural language
      - [ ] Provide suggestions based on user input

- [X] **User Management**
  - [X] **Admin Login**
    - [X] Manage users
    - [X] Manage reminders
    - [X] Manage Reminder Library Page

- [X] **Reminder Management**
  - [X] **User Functions**
    - [X] Create reminders
    - [X] Edit reminders
    - [X] Delete reminders
  - [ ] **Trigger Reminders**
    - [ ] Based on pubsub data
    - [ ] Use WebSocket for real-time updates
    - [ ] Display on user devices

- [ ] **Light Interaction**
  - [ ] **Categorize Reminders**
    - [ ] Urgent
    - [ ] Normal
    - [ ] Low Importance
  - [ ] **Light Triggering**
    - [ ] Surrounding lights respond based on reminder category
    - [ ] User selects category via web app
    - [ ] Category stored in the database
    - [ ] Data sent to the device when reminder is triggered
  - [ ] **Arduino Communication**
    - [X] Arduino controls lights
    - [ ] iPad sends command to Arduino using BLT LE communication

- [ ] **Local Server Setup**
  - [ ] **Run Mosquitto Server**
    - [ ] Install and configure Mosquitto on local LAN
    - [ ] Ensure connectivity with all devices on the network
  - [ ] **Connect Devices**
    - [ ] Ensure sensors, app server, and other devices can connect to the local Mosquitto server

- [ ] **Utility Data Logic**
  - [ ] **Analyze Utility Data**
    - [ ] Monitor utility usage patterns (e.g., energy, water)
    - [ ] Identify possible reminders (e.g., turn off lights, reduce water usage)
  - [ ] **Define JSON Structure for Reminders**

- [X] **Library and Suggestions**
  - [X] **Library Page**
    - [X] Provide default/common reminders
    - [X] Users can select default reminders
  - [ ] **Suggestions Feature**
    - [ ] AI chat assistant suggests reminders based on user input
    - [ ] Tailored suggestions for activities, utilities, and times
    - [ ] Improve suggestions with user feedback and interaction data

- [ ] **Testing and Integration**
  - [ ] **End-to-End Testing**
    - [ ] Test sensor data collection
    - [ ] Ensure data transmission via Mosquitto
    - [ ] Confirm app server subscriptions and event tracking
    - [ ] Test web application for reminder creation
    - [ ] Validate AI chat assistant functionality
    - [ ] Test reminder management (create, edit, delete)
    - [ ] Confirm WebSocket real-time updates
    - [ ] Test light interaction based on reminder categories
    - [ ] Validate Arduino and BLT LE communication for lights
    - [ ] Ensure correct local server setup and device connectivity
  - [ ] **Integration Testing**
    - [ ] Verify the entire workflow from data collection to reminder triggering and light interaction
    - [ ] Check system performance under different conditions
    - [ ] Ensure system stability and reliability
