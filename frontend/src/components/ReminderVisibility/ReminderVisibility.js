import React, { useEffect, useState, useContext } from 'react';
import { api } from '../../utils/api';
import { AuthContext } from '../../Authcontext';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';

const ReminderVisibility = () => {
  const [reminders, setReminders] = useState([]);
  const [users, setUsers] = useState([]);
  const [formValues, setFormValues] = useState({ sharedWith: [] });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState('');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    fetchReminders();
    fetchUsers();
  }, []);

  const handleShare = (reminder) => {
    setFormValues({
      ...reminder,
      sharedWith: Array.isArray(reminder.sharedWith) ? reminder.sharedWith : []
    });
    setDialogAction('share');
    setIsDialogOpen(true);
  };

  const handleUnshare = async (reminderId, userId) => {
    try {
      await api.delete(`/api/unshare-reminder/${reminderId}`, {
        data: { userId },
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchReminders();
    } catch (error) {
      console.error('Error unsharing reminder:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (dialogAction === 'share') {
        await api.post('/api/share-reminder', {
          reminderId: formValues.id,
          userIds: formValues.sharedWith
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      setIsDialogOpen(false);
      fetchReminders();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await api.get('/reminders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReminders(response.data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Reminder Sharing</h2>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Reminder ID</TableCell>
              <TableCell>Reminder Message</TableCell>
              <TableCell>Shared With</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reminders.map((reminder) => (
              <TableRow key={reminder.id}>
                <TableCell>{reminder.id}</TableCell>
                <TableCell>{reminder.message}</TableCell>
                <TableCell>
                  {Array.isArray(reminder.sharedWith) && reminder.sharedWith.map((user) => (
                    <Chip
                      key={user.id}
                      label={user.email}
                      onDelete={() => handleUnshare(reminder.id, user.id)}
                      style={{ margin: '2px' }}
                    />
                  ))}
                </TableCell>
                <TableCell>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => handleShare(reminder)}
                    style={{ marginRight: '10px' }}
                  >
                    Share
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Share Reminder</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>Share With</InputLabel>
            <Select
              multiple
              value={formValues.sharedWith}
              onChange={(e) => setFormValues({ ...formValues, sharedWith: e.target.value })}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Share</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ReminderVisibility;
