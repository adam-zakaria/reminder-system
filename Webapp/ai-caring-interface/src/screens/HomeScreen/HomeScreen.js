import React, { useState, useEffect, useContext } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import ReminderForm from '../../components/ReminderForm/ReminderForm';
import ChatBox from '../../components/ChatBox/ChatBox';
import { api } from '../../utils/api';
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
    delay: null,
    disappearOnCondition: 'false',
    activity: null,
    triggerTime: null,
    triggerType: null,
    lightCategoryId: null
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
    const invalid = [];
    const { userId, message, interval, display, time, utility_name, component_name, condition, delay, activity, triggerTime, triggerType, lightCategoryId } = reminder;

    // Validate required fields for all reminder types
    if (!userId) invalid.push('userId');
    if (!message) invalid.push('message');
    if (!interval) invalid.push('interval');
    if (!display) invalid.push('display');
    if (!lightCategoryId) invalid.push('lightCategoryId');
      
    // Non-dependent reminder
    if (time) {
      if (utility_name || component_name || condition || delay || activity || triggerTime || triggerType) {
        invalid.push('utility_name', 'component_name', 'condition', 'delay', 'activity', 'triggerTime', 'triggerType');
      }
    }
    // Dependent reminder
    else if (utility_name && component_name && condition) {
      if (time || activity || triggerTime || triggerType) {
        invalid.push('time', 'activity', 'triggerTime', 'triggerType');
      }
    }
    // Activity-based reminder
    else if (activity && triggerTime && triggerType) {
      if (time || utility_name || component_name || condition || delay) {
        invalid.push('time', 'utility_name', 'component_name', 'condition', 'delay');
      }
    }
    // Generic reminder (none of the specific types)
    else {
      // Add validation for any other required fields here
    }

    setInvalidFields(invalid);
    return invalid.length > 0;
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const isInvalid = formInvalid();
    if (isInvalid) {
      const invalidFieldNames = invalidFields.join(', ');
      toast.error(`Please fill in the following fields correctly: ${invalidFieldNames}`);
      return;
    }

    setLoadingReminder(true);
    try {
      const response = await api.post('/reminders', reminder, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response.data);
      toast.success('Reminder Created Successfully!');
      navigate('/reminders');
    } catch (error) {
      console.error(error);
      toast.error(`An error occurred: ${error.message}`);
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
        lightCategoryId: response.response.lightCategoryId || prevReminder.lightCategoryId
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
    height: '100vh',
  },
  rightContainer: {
    flex: 1,
    padding: 16,
    height: '100vh',
    maxHeight: '90vh', // Adjusted height to make ChatBox shorter
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
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
