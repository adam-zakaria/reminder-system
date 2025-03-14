import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Select, MenuItem, FormControl, InputLabel, Switch, FormControlLabel,
  CircularProgress, Snackbar
} from '@mui/material';
import { Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { api } from '../../utils/api';
import { validateReminderForm } from '../../utils/validation';

const RemindersList = () => {
  const [reminders, setReminders] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    message: '',
    interval: '',
    time: '',
    type: '',
    utility_name: '',
    component_name: '',
    condition: '',
    display: '',
    delay: 0,
    sent: false,
    disappearOnCondition: false,
    activity: '',
    triggerTime: 0,
    triggerType: 'begin'
  });
  const [invalidFields, setInvalidFields] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [reminderToDelete, setReminderToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/reminders', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setReminders(response.data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      setSnackbar({ open: true, message: 'Failed to fetch reminders', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (reminder = null) => {
    const initialData = reminder || {
      userId: '',
      message: '',
      interval: '',
      time: '',
      type: '',
      utility_name: '',
      component_name: '',
      condition: '',
      display: '',
      delay: 0,
      sent: false,
      disappearOnCondition: false,
      activity: '',
      triggerTime: 0,
      triggerType: 'begin'
    };

    if (initialData.time) {
      initialData.type = 'General';
    } else if (initialData.utility_name && initialData.component_name && initialData.condition) {
      initialData.type = 'Utility';
    } else if (initialData.activity && initialData.triggerTime && initialData.triggerType) {
      initialData.type = 'Activity';
    }

    setSelectedReminder(reminder);
    setFormData(initialData);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedReminder(null);
  };

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const validateForm = () => {
    const invalid = validateReminderForm(formData);
    setInvalidFields(invalid);
    if (invalid.length > 0) {
      setSnackbar({ open: true, message: `Please fill in the following fields correctly: ${invalid.join(', ')}`, severity: 'error' });
      return false;
    }
    return true;
  };

  const mapTypeToServerValue = (type) => {
    switch (type) {
      case 'General': return 'non-dependent';
      case 'Utility': return 'dependent';
      case 'Activity': return 'activity-based';
      default: return '';
    }
  };

  const mapTypeToDisplayValue = (type) => {
    switch (type) {
      case 'non-dependent': return 'General';
      case 'dependent': return 'Utility';
      case 'activity-based': return 'Activity';
      default: return '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formDataToSend = {
      ...formData,
      type: mapTypeToServerValue(formData.type)
    };

    try {
      const token = localStorage.getItem('token');
      if (selectedReminder) {
        await api.put(`/reminders/${selectedReminder.id}`, formDataToSend, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: 'Reminder updated successfully', severity: 'success' });
      } else {
        await api.post('/api/reminders', formDataToSend, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: 'Reminder added successfully', severity: 'success' });
      }
      fetchReminders();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving reminder:', error);
      setSnackbar({ open: true, message: 'Failed to save reminder. Please try again.', severity: 'error' });
    }
  };

  const handleDeleteClick = (id) => {
    setReminderToDelete(id);
    setOpenConfirmDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (reminderToDelete) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/reminders/${reminderToDelete}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setSnackbar({ open: true, message: 'Reminder deleted successfully', severity: 'success' });
        fetchReminders();
      } catch (error) {
        console.error('Error deleting reminder:', error);
        setSnackbar({ open: true, message: 'Failed to delete reminder', severity: 'error' });
      }
      setOpenConfirmDialog(false);
    }
  };

  const renderFormFields = () => {
    switch (formData.type) {
      case 'General':
        return (
          <TextField
            name="time"
            label="Time"
            type="datetime-local"
            value={formData.time}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            required
            error={invalidFields.includes('time')}
            helperText={invalidFields.includes('time') ? 'Time is required' : ''}
          />
        );
      case 'Utility':
        return (
          <>
            <TextField
              name="utility_name"
              label="Utility Name"
              value={formData.utility_name}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
              error={invalidFields.includes('utility_name')}
              helperText={invalidFields.includes('utility_name') ? 'Utility Name is required' : ''}
            />
            <TextField
              name="component_name"
              label="Component Name"
              value={formData.component_name}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
              error={invalidFields.includes('component_name')}
              helperText={invalidFields.includes('component_name') ? 'Component Name is required' : ''}
            />
            <TextField
              name="condition"
              label="Condition"
              value={formData.condition}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
              error={invalidFields.includes('condition')}
              helperText={invalidFields.includes('condition') ? 'Condition is required' : ''}
            />
            <TextField
              name="delay"
              label="Delay (seconds)"
              type="number"
              value={formData.delay}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
              error={invalidFields.includes('delay')}
              helperText={invalidFields.includes('delay') ? 'Delay is required' : ''}
            />
          </>
        );
      case 'Activity':
        return (
          <>
            <TextField
              name="activity"
              label="Activity"
              value={formData.activity}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
              error={invalidFields.includes('activity')}
              helperText={invalidFields.includes('activity') ? 'Activity is required' : ''}
            />
            <TextField
              name="triggerTime"
              label="Trigger Time (minutes)"
              type="number"
              value={formData.triggerTime}
              onChange={handleInputChange}
              fullWidth
              margin="normal"
              required
              error={invalidFields.includes('triggerTime')}
              helperText={invalidFields.includes('triggerTime') ? 'Trigger Time is required' : ''}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Trigger Type</InputLabel>
              <Select
                name="triggerType"
                value={formData.triggerType}
                onChange={handleInputChange}
                required
                error={invalidFields.includes('triggerType')}
              >
                <MenuItem value="begin">Begin</MenuItem>
                <MenuItem value="end">End</MenuItem>
              </Select>
            </FormControl>
          </>
        );
      default:
        return null;
    }
  };

  const renderDialog = () => (
    <Dialog open={openDialog} onClose={handleCloseDialog}>
      <DialogTitle>{selectedReminder ? 'Edit Reminder' : 'Add Reminder'}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <TextField
            name="userId"
            label="User ID"
            value={formData.userId}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
            error={invalidFields.includes('userId')}
            helperText={invalidFields.includes('userId') ? 'User ID is required' : ''}
          />
          <TextField
            name="message"
            label="Message"
            value={formData.message}
            onChange={handleInputChange}
            fullWidth
            margin="normal"
            required
            error={invalidFields.includes('message')}
            helperText={invalidFields.includes('message') ? 'Message is required' : ''}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
              error={invalidFields.includes('type')}
            >
              <MenuItem value="General">General</MenuItem>
              <MenuItem value="Utility">Utility</MenuItem>
              <MenuItem value="Activity">Activity</MenuItem>
            </Select>
          </FormControl>
          {renderFormFields()}
          <FormControlLabel
            control={<Switch checked={formData.sent} onChange={handleInputChange} name="sent" />}
            label="Sent"
          />
          <FormControlLabel
            control={<Switch checked={formData.disappearOnCondition} onChange={handleInputChange} name="disappearOnCondition" />}
            label="Disappear On Condition"
          />
          <Button type="submit" color="primary" variant="contained" fullWidth style={{ marginTop: '20px' }}>
            {selectedReminder ? 'Update' : 'Add'}
          </Button>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog} color="secondary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <div style={{ padding: '20px' }}>
      <h2>Reminders</h2>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => handleOpenDialog()}
        style={{ marginBottom: '20px' }}
      >
        Add Reminder
      </Button>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User ID</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Interval</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Utility Name</TableCell>
                <TableCell>Component Name</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Display</TableCell>
                <TableCell>Delay</TableCell>
                <TableCell>Sent</TableCell>
                <TableCell>Disappear On Condition</TableCell>
                <TableCell>Activity</TableCell>
                <TableCell>Trigger Time</TableCell>
                <TableCell>Trigger Type</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reminders.map((reminder) => (
                <TableRow key={reminder.id}>
                  <TableCell>{reminder.userId}</TableCell>
                  <TableCell>{reminder.message}</TableCell>
                  <TableCell>{reminder.interval}</TableCell>
                  <TableCell>{reminder.time}</TableCell>
                  <TableCell>{mapTypeToDisplayValue(reminder.type)}</TableCell>
                  <TableCell>{reminder.utility_name}</TableCell>
                  <TableCell>{reminder.component_name}</TableCell>
                  <TableCell>{reminder.condition}</TableCell>
                  <TableCell>{reminder.display}</TableCell>
                  <TableCell>{reminder.delay}</TableCell>
                  <TableCell>{reminder.sent ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{reminder.disappearOnCondition ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{reminder.activity}</TableCell>
                  <TableCell>{reminder.triggerTime}</TableCell>
                  <TableCell>{reminder.triggerType}</TableCell>
                  <TableCell>
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => handleOpenDialog(reminder)}
                      style={{ marginRight: '10px' }}
                    >
                      Edit
                    </Button>
                    <Button
                      startIcon={<DeleteIcon />}
                      color="error"
                      onClick={() => handleDeleteClick(reminder.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {renderDialog()}
      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>Are you sure you want to delete this reminder?</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default RemindersList;