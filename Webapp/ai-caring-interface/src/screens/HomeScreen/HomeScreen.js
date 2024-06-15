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
    activity: '',
    triggerTime: null,
    triggerType: '',
  });
  const [loadingReminder, setLoadingReminder] = useState(false);
  const [invalidFields, setInvalidFields] = useState([]);
  const [submitted, setSubmitted] = useState(false);
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
    let invalid = [];
    if (!reminder.userId) invalid.push('userId');
    if (!reminder.message) invalid.push('message');
    if (!reminder.interval) invalid.push('interval');
    if (!reminder.display) invalid.push('display');

    const nondependent = !reminder.time && reminder.utility_name && reminder.component_name && reminder.condition;
    const dependent = reminder.time && (!reminder.utility_name || !reminder.component_name || !reminder.condition);
    const activityBased = !reminder.time && !reminder.utility_name && !reminder.component_name && !reminder.condition && reminder.activity && reminder.triggerType ;

    if (!nondependent && !dependent && !activityBased) {
      if (!reminder.time) invalid.push('time');
      if (!reminder.utility_name) invalid.push('utility_name');
      if (!reminder.component_name) invalid.push('component_name');
      if (!reminder.condition) invalid.push('condition');
      if (!reminder.activity) invalid.push('activity');
      if (!reminder.triggerType) invalid.push('triggerType');
    }

    setInvalidFields(invalid);
    return invalid.length > 0;
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (formInvalid()) {
      return;
    }

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
        interval: response.response.interval?.toLowerCase() || prevReminder.interval,
        time: response.response.time || prevReminder.time,
        utility_name: response.response.utility_name || prevReminder.utility_name,
        component_name: response.response.component_name || prevReminder.component_name,
        condition: response.response.condition || prevReminder.condition,
        delay: response.response.delay || prevReminder.delay,
        activity: response.response.activity || prevReminder.activity,
        triggerTime: response.response.triggerTime || prevReminder.triggerTime,
        triggerType: response.response.triggerType || prevReminder.triggerType,
      }));
    }
  };

  useEffect(() => {
    formInvalid(); // Update invalid fields on state change
  }, [reminder]);

  return (
    <View style={styles.container}>
      <View style={styles.leftContainer}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <ReminderForm
            reminder={reminder}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            loadingReminder={loadingReminder}
            invalidFields={invalidFields}
            isEditing={false}
            submitted={submitted}
          />
          {loadingReminder && <ActivityIndicator size="large" color="#0000ff" />}
        </ScrollView>
      </View>
      <View style={styles.rightContainer}>
        <ChatBox onChatResponse={handleChatResponse} />
      </View>
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
