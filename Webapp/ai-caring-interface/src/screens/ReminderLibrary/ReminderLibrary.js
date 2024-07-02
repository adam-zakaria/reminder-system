import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../Authcontext';
import { api } from '../../utils/api'; // Import the Axios instance
import {
  Container,
  Grid,
  Paper,
  Typography,
  IconButton,
  TextField,
  Button
} from '@mui/material';
import { Add, Delete, Edit, Save } from '@mui/icons-material';
import styles from './ReminderLibrary.module.css';

const ReminderLibrary = () => {
  const { role, token } = useContext(AuthContext); // Destructure token from AuthContext
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState('');
  const [editingReminder, setEditingReminder] = useState(null);
  const [editingText, setEditingText] = useState('');

  // Fetch reminders from the server when the component mounts
  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const response = await api.get('/api/reminderLibrary', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReminders(response.data);
      } catch (error) {
        console.error('Error fetching reminders:', error);
      }
    };

    fetchReminders();
  }, [token]);

  const handleAddReminder = async () => {
    if (newReminder.trim()) {
      try {
        const response = await api.post('/api/reminderLibrary', { text: newReminder }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReminders([...reminders, response.data]);
        setNewReminder('');
      } catch (error) {
        console.error('Error adding reminder:', error);
      }
    }
  };

  const handleEditReminder = (id, text) => {
    setEditingReminder(id);
    setEditingText(text);
  };

  const handleSaveEdit = async (id) => {
    try {
      const response = await api.put(`/api/reminderLibrary/${id}`, { text: editingText }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReminders(reminders.map(reminder => (reminder.id === id ? response.data : reminder)));
      setEditingReminder(null);
      setEditingText('');
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await api.delete(`/api/reminderLibrary/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReminders(reminders.filter(reminder => reminder.id !== id));
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  return (
    <Container className={styles.container}>
      <Typography variant="h4" gutterBottom>
        Reminder Library
      </Typography>
      <Grid container spacing={3} justifyContent="center">
        {reminders.map(reminder => (
          <Grid item xs={12} sm={6} md={4} key={reminder.id}>
            <Paper className={styles.reminderTile}>
              {editingReminder === reminder.id ? (
                <TextField
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  fullWidth
                />
              ) : (
                <Typography
                  variant="h6"
                  onDoubleClick={() => handleEditReminder(reminder.id, reminder.text)}
                >
                  {reminder.text}
                </Typography>
              )}
              {role === 'superuser' && (
                <div className={styles.actions}>
                  {editingReminder === reminder.id ? (
                    <IconButton edge="end" onClick={() => handleSaveEdit(reminder.id)}>
                      <Save />
                    </IconButton>
                  ) : (
                    <IconButton edge="end" onClick={() => handleEditReminder(reminder.id, reminder.text)}>
                      <Edit />
                    </IconButton>
                  )}
                  <IconButton edge="end" onClick={() => handleDeleteReminder(reminder.id)}>
                    <Delete />
                  </IconButton>
                </div>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
      {role === 'superuser' && (
        <div className={styles.addReminder}>
          <TextField
            label="Add new reminder"
            value={newReminder}
            onChange={(e) => setNewReminder(e.target.value)}
            variant="outlined"
            fullWidth
            className={styles.textField}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={handleAddReminder}
            className={styles.addButton}
          >
            Add
          </Button>
        </div>
      )}
    </Container>
  );
};

export default ReminderLibrary;
