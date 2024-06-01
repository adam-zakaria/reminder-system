import React, { useState } from 'react';
import axios from 'axios';
import { View, TextInput, Button, StyleSheet, ActivityIndicator, ScrollView, Picker } from 'react-native';
import ChatBotComponent from '../src/components/ChatAssistant/ChatAssistant';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'https://gateway.parcs.northeastern.edu/ai-caring/api/', // Update with your backend server URL
});

function App() {
  const [reminder, setReminder] = useState({
    userId: '',
    message: '',
    interval: '',
    time: '',
    utility_name: '',
    component_name: '',
    condition: '',
    display: '',
    delay: '',
    disappearOnCondition: 'false',
  });

  const [smartText, setSmartText] = useState('');
  const [loadingReminder, setLoadingReminder] = useState(false);
  const [loadingSmartText, setLoadingSmartText] = useState(false);
  const [showSmartTextModal, setShowSmartTextModal] = useState(false);

  const formInvalid =
    !reminder.userId ||
    !reminder.message ||
    !reminder.interval ||
    !reminder.display ||
    !reminder.disappearOnCondition ||
    (reminder.time === null && (reminder.utility_name !== null || reminder.component_name !== null || reminder.condition !== null));
  const handleChange = (name, value) => {
    setReminder({
      ...reminder,
      [name]: value
    });
  };

  const handleSmartTextChange = (value) => {
    setSmartText(value);
    // Here you would call your OpenAI API to process the smart text and autofill the form
  };

  const handleSubmit = async () => {
    setLoadingReminder(true);
    try {
      const response = await api.post('/reminders', reminder);
      console.log(response.data);
      alert('Reminder Created Successfully!');
    } catch (error) {
      console.error(error);
    }
    setLoadingReminder(false);
  };

  // Define the submitSmartText function
  const submitSmartText = async () => {
    setLoadingSmartText(true);
    try {
      const response = await api.post('/smart-text', { text: smartText });
      console.log(response.data);

      // Check if the response contains an error
      if (response.data.status === 'Text processed' && response.data.data.error) {
        alert(response.data.data.error); // Display the error in a pop-up
      } else {

        // Extract the data from the response
        const { data } = response.data;

        // Update the reminder state with the data
        setReminder({
          userId: parseInt(data.userId), // Assuming userId is a string
          message: data.message,
          display: data.display,
          interval: data.interval,
          time: data.time ? data.time.toString() : null, // Assuming time is a string
          delay: data.delay.toString(), // Assuming delay is a string
          utility_name: data.utility_name,
          component_name: data.component_name,
          condition: data.condition
        });
      }
    } catch (error) {
      console.error(error);
    }
    setLoadingSmartText(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.fieldGroup}>
            <TextInput
              style={styles.input}
              onChangeText={(value) => handleChange('userId', value)}
              value={reminder.userId}
              placeholder="User ID"
            />
            <TextInput style={styles.input} onChangeText={(value) => handleChange('message', value)} value={reminder.message} placeholder="Message" />
            <TextInput style={styles.input} onChangeText={(value) => handleChange('interval', value)} value={reminder.interval} placeholder="Interval" />
            <TextInput style={styles.input} onChangeText={(value) => handleChange('time', value)} value={reminder.time} placeholder="Time" />
            <TextInput style={styles.input} onChangeText={(value) => handleChange('utility_name', value)} value={reminder.utility_name} placeholder="Utility Name" />
            <TextInput style={styles.input} onChangeText={(value) => handleChange('component_name', value)} value={reminder.component_name} placeholder="Component Name" />
            <TextInput style={styles.input} onChangeText={(value) => handleChange('condition', value)} value={reminder.condition} placeholder="Condition" />
            <TextInput style={styles.input} onChangeText={(value) => handleChange('display', value)} value={reminder.display} placeholder="Display" />
            <TextInput style={styles.input} onChangeText={(value) => handleChange('delay', value)} value={reminder.delay} placeholder="Delay" />
            <Picker
              selectedValue={reminder.disappearOnCondition}
              style={styles.picker}
              onValueChange={(itemValue) => handleChange('disappearOnCondition', itemValue)}
            >
              <Picker.Item label="Disappear on Condition" value="true" />
              <Picker.Item label="Do Not Disappear" value="false" />
            </Picker>
          </View>
          <Button
            onPress={handleSubmit}
            title="Create Reminder"
            disabled={loadingReminder || formInvalid}
          />
        </ScrollView>
        {loadingReminder && <ActivityIndicator size="large" color="#0000ff" />}
      </View>
      <ChatBotComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  leftContainer: {
    flex: 1,
    padding: 16,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
});

export default App;
