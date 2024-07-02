import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [formValues, setFormValues] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = () => {
    setFormValues({});
    setDialogAction('create');
    setIsDialogOpen(true);
  };

  const handleEdit = (user) => {
    setFormValues(user);
    setDialogAction('edit');
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId) => {
    try {
      await api.delete(`/api/users/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (dialogAction === 'create') {
        await api.post('/api/users', formValues);
      } else {
        await api.put(`/api/users/${formValues.id}`, formValues);
      }
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Users</h2>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={handleCreate}
        style={{ marginBottom: '20px' }}
      >
        Add User
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => handleEdit(user)}
                    style={{ marginRight: '10px' }}
                  >
                    Edit
                  </Button>
                  <Button
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={() => handleDelete(user.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>{dialogAction === 'create' ? 'Create User' : 'Edit User'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            fullWidth
            value={formValues.username || ''}
            onChange={(e) => setFormValues({ ...formValues, username: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={formValues.email || ''}
            onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Role"
            fullWidth
            value={formValues.role || ''}
            onChange={(e) => setFormValues({ ...formValues, role: e.target.value })}
          />
          {dialogAction === 'create' && (
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              value={formValues.password || ''}
              onChange={(e) => setFormValues({ ...formValues, password: e.target.value })}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default UserList;