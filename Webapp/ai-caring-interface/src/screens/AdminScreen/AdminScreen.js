// src/screens/AdminScreen/AdminScreen.js

import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import Select from 'react-select';
import styles from './AdminScreen.css';

const AdminScreen = () => {
  const [users, setUsers] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [newClientMapping, setNewClientMapping] = useState({ userId: '', targetClientId: '' });
  const [newReminderMapping, setNewReminderMapping] = useState({ reminderId: '', userEmails: [] });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchReminders();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await api.get('/api/reminders');
      setReminders(response.data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewClientMapping({ ...newClientMapping, [name]: value });
  };

  const handleReminderInputChange = (selectedOptions) => {
    const userEmails = selectedOptions.map((option) => option.value);
    setNewReminderMapping({ ...newReminderMapping, userEmails });
  };

  const handleAddClientMapping = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await api.post('/api/userClientMappings', {
        userId,
        targetClientId: newClientMapping.targetClientId,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setNewClientMapping({ userId: '', targetClientId: '' });
      fetchUsers();
    } catch (error) {
      console.error('Error adding client mapping:', error);
    }
  };

  const handleAddReminderMapping = async (reminderId) => {
    try {
      const token = localStorage.getItem('token');
      const userIds = users
        .filter((user) => newReminderMapping.userEmails.includes(user.email))
        .map((user) => user.id);

      await api.post('/api/reminderMappings', {
        reminderId,
        userIds,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setNewReminderMapping({ reminderId: '', userEmails: [] });
      fetchReminders();
    } catch (error) {
      console.error('Error adding reminder mapping:', error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={`${styles.mainContent} ${isSidebarCollapsed ? styles.mainContentCollapsed : ''}`}>
        <h1>Admin Screen</h1>
        <h2>Users</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Target Client ID</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>
                  <input
                    type="text"
                    name="targetClientId"
                    value={newClientMapping.targetClientId}
                    onChange={handleInputChange}
                  />
                </td>
                <td>
                  <button onClick={() => handleAddClientMapping(user.id)}>
                    Add Mapping
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>Reminders</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Type</th>
              <th>Created By Email</th>
              <th>Visible to User Emails</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reminders.map((reminder) => (
              <tr key={reminder.id}>
                <td>{reminder.id}</td>
                <td>{reminder.display}</td>
                <td>{reminder.message}</td>
                <td>{reminder.type}</td>
                <td>{reminder.email}</td>
                <td>
                  <Select
                    isMulti
                    options={users.map((user) => ({ value: user.email, label: user.email }))}
                    value={users.filter((user) => newReminderMapping.userEmails.includes(user.email)).map((user) => ({ value: user.email, label: user.email }))}
                    onChange={handleReminderInputChange}
                  />
                </td>
                <td>
                  <button onClick={() => handleAddReminderMapping(reminder.id)}>
                    Add Mapping
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminScreen;
