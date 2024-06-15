import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useParams, useNavigate } from 'react-router-dom';
import ReminderForm from '../../components/ReminderForm/ReminderForm';
import api from '../../utils/api';
import { AuthContext } from '../../Authcontext';
import { jwtDecode } from 'jwt-decode';

const EditReminderScreen = () => {
  const [reminder, setReminder] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const { reminderId } = useParams();
  const navigate = useNavigate();
  const { token, refreshToken } = useContext(AuthContext);

  useEffect(() => {
    const fetchReminder = async () => {
      if (!token) {
        setError('Token is required');
        setLoading(false);
        return;
      }

      let userId;
      try {
        if (typeof token === 'string') {
          const decodedToken = jwtDecode(token);
          userId = decodedToken.userId;
        } else {
          throw new Error('Invalid token type');
        }
      } catch (decodeError) {
        console.error('Error decoding token:', decodeError);
        setError('Invalid token');
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/reminders/${reminderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setReminder(response.data);
      } catch (fetchError) {
        console.error('Error fetching reminder:', fetchError);
        setError('Failed to fetch reminder');
      } finally {
        setLoading(false);
      }
    };

    fetchReminder();
  }, [reminderId, token]);

  const handleChange = (field, value) => {
    setReminder((prevReminder) => ({
      ...prevReminder,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called');
    setUpdateError(null);
    try {
      const response = await api.put(`/reminders/${reminderId}`, reminder, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 200) {
        navigate('/reminders');
      } else {
        setUpdateError(response.data.error || 'Failed to update reminder');
      }
    } catch (submitError) {
      console.error('Error updating reminder:', submitError);
      setUpdateError('Failed to update reminder. Please try again.');
    }
  };

  const formInvalid = () => {
    return false
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {updateError && <Text style={styles.errorText}>{updateError}</Text>}
      <ReminderForm
        reminder={reminder}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        loadingReminder={loading}
        formInvalid={formInvalid}
        isEditing={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    marginBottom: 16,
  },
});

export default EditReminderScreen;