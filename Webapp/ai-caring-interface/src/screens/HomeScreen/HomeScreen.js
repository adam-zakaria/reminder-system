import React, { useState, useEffect, useContext } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useNavigate } from 'react-router-dom';
import ReminderForm from '../../components/ReminderForm/ReminderForm';
import ChatBox from '../../components/ChatBox/ChatBox';
import api from '../../utils/api';
import { AuthContext } from '../../Authcontext';
import { jwtDecode } from 'jwt-decode';

function HomeScreen() {
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
  const [loadingReminder, setLoadingReminder] = useState(false);
  const navigate = useNavigate();
  const { token } = useContext(AuthContext);

  useEffect(() => {
    if (token) {
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      setReminder((prevReminder) => ({ ...prevReminder, userId }));
    }
  }, [token]);

  const handleChange = (name, value) => {
    setReminder({ ...reminder, [name]: value });
  };

  const formInvalid = () => {
    if (reminder.userId && reminder.message && reminder.interval && reminder.display) {
      const nondependent = (reminder.time === null || reminder.time === '') ? (reminder.utility_name !== null && reminder.utility_name !== '') ? (reminder.component_name !== null && reminder.component_name !== '') ? (reminder.condition !== null && reminder.condition !== '') ? true : false : false : false : false;
      const dependent = (reminder.time !== null && reminder.time !== '') ? (reminder.utility_name === null || reminder.utility_name === '') ? (reminder.component_name === null || reminder.component_name === '') ? (reminder.condition === null || reminder.condition === '') ? true : false : false : false : false;
      console.log(reminder.time, "reminder.time", reminder.utility_name, "reminder.utility_name", reminder.component_name, "reminder.component_name", reminder.condition, "reminder.condition" )

      console.log(nondependent, dependent, "prev to if");
      if (nondependent || dependent) {
        console.log(nondependent, dependent,"inside if");
        return false;
      } else {
        console.log("else of non dep and dep");
        return true;
      }
    } else {
      console.log("when basic details are not there", `${reminder.userId} && ${reminder.message} && ${reminder.interval} && ${reminder.display}`);
      return true;
    }
  };

  const handleSubmit = async () => {
    setLoadingReminder(true);
    try {
      const response = await api.post('/reminders', reminder);
      console.log(response.data);
      alert('Reminder Created Successfully!');
      navigate('/reminders');
    } catch (error) {
      console.error(error);
    }
    setLoadingReminder(false);
  };

  const handleChatResponse = (response) => {
    if (response && Object.keys(response).length > 0) {
      setReminder((prevReminder) => ({
        ...prevReminder,
        message: response.response.message || prevReminder.message,
        display: response.response.display || prevReminder.display,
        interval: response.response.interval || prevReminder.interval,
        time: response.response.time || prevReminder.time,
        utility_name: response.response.utility_name || prevReminder.utility_name,
        component_name: response.response.component_name || prevReminder.component_name,
        condition: response.response.condition || prevReminder.condition,
        delay: response.response.delay || prevReminder.delay,
      }));
    }
  };

  useEffect(() => {
    console.log('Reminder state updated:', reminder);
  }, [reminder]);

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {console.log(formInvalid, "forminvalid")}
          <ReminderForm
            reminder={reminder}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            loadingReminder={loadingReminder}
            formInvalid={formInvalid}
          />
          {loadingReminder && <ActivityIndicator size="large" color="#0000ff" />}
        </ScrollView>
      </View>
      <View style={styles.rightContainer}>
        <ChatBox onChatResponse={handleChatResponse} />
      </View>
      <TouchableOpacity
        style={styles.reminderButton}
        onPress={() => navigate('/reminders')}
      >
        <Text style={styles.reminderButtonText}>Go to Reminders</Text>
      </TouchableOpacity>
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
  rightContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  reminderButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 10,
    marginHorizontal: 20,
  },
  reminderButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default HomeScreen;