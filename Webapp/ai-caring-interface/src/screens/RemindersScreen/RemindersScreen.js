import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { AuthContext } from '../../Authcontext';
import { FaTrashAlt, FaEdit } from 'react-icons/fa';

const RemindersScreen = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const response = await api.get('/reminders', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          setReminders(response.data);
        } else {
          setError(response.data.error);
        }
      } catch (error) {
        console.error('Error fetching reminders:', error);
        if (error.response) {
          setError(error.response.data.error);
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchReminders();
    }
  }, [token]);

  const handleDeleteReminder = async (id) => {
    try {
      await api.delete(`/reminders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setReminders(reminders.filter((reminder) => reminder.id !== id));
    } catch (error) {
      console.error('Error deleting reminder:', error);
      setError('An error occurred while deleting the reminder');
    }
  };

  const handleEditReminder = (reminder) => {
    navigate(`/edit-reminder/${reminder.id}`); // Navigate with reminderId
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.reminderItem} activeOpacity={0.7}>
      <View style={styles.reminderContent}>
        <View style={styles.reminderTextContainer}>
          <Text style={styles.reminderText}>{item.message}</Text>
        </View>
        <View style={styles.reminderDetailsContainer}>
          <Text style={styles.reminderDetails}>Interval: {item.interval}</Text>
          <Text style={styles.reminderDetails}>Time: {item.time}</Text>
        </View>
        <View style={styles.reminderActionsContainer}>
          <TouchableOpacity onPress={() => handleDeleteReminder(item.id)}>
            <FaTrashAlt size={24} color="#dc3545" />
          </TouchableOpacity>
          <View style={styles.actionButtonSeparator} />
          <TouchableOpacity onPress={() => handleEditReminder(item)}>
            <FaEdit size={24} color="#007bff" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />;
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
      <TouchableOpacity style={styles.backButton} onPress={() => navigate('/home')}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
      <FlatList
        data={reminders}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.headerMessageText}>Message</Text>
            <Text style={styles.headerDetailsText}>Details</Text>
            <Text style={styles.headerActionsText}>Actions</Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reminders found</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
    marginBottom: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reminderTextContainer: {
    flex: 2,
    marginRight: 16,
  },
  reminderText: {
    fontSize: 18,
    fontWeight: 'normal',
    color: '#333',
  },
  reminderDetailsContainer: {
    flex: 1.5,
  },
  reminderDetails: {
    fontSize: 16,
    color: '#666',
  },
  reminderActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.5,
  },
  actionButtonSeparator: {
    width: 16,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    backgroundColor: '#e9ecef',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  headerMessageText: {
    flex: 2,
    fontWeight: 'normal',
    fontSize: 18,
    color: '#495057',
  },
  headerDetailsText: {
    flex: 1.5,
    fontWeight: 'normal',
    fontSize: 18,
    color: '#495057',
  },
  headerActionsText: {
    flex: 0.5,
    fontWeight: 'normal',
    fontSize: 18,
    color: '#495057',
  },
  separator: {
    height: 1,
    backgroundColor: '#dee2e6',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
  },
});

export default RemindersScreen;
