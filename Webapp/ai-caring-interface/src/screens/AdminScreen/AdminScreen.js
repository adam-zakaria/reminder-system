import React, { useState, useEffect } from 'react';
import api from '../../utils/api';

const AdminScreen = () => {
  const [users, setUsers] = useState([]);
  const [newClientMapping, setNewClientMapping] = useState({
    userId: '',
    targetClientId: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setNewClientMapping({ ...newClientMapping, [name]: value });
  };

  const handleAddClientMapping = async (userId) => {
    try {
      const token = localStorage.getItem('token'); // Assuming the JWT token is stored in localStorage
      await api.post('/api/userClientMappings', {
        userId,
        targetClientId: newClientMapping.targetClientId,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setNewClientMapping({ userId: '', targetClientId: '' });
      fetchUsers(); // Refetch users after successful mapping
    } catch (error) {
      console.error('Error adding client mapping:', error);
    }
  };

  return (
    <div>
      <h1>Admin Screen</h1>
      <h2>Users</h2>
      <table>
        <thead>
          <tr>
            <th style={styles.th}>ID</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Role</th>
            <th style={styles.th}>Target Client ID</th>
            <th style={styles.th}>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td style={styles.td}>{user.id}</td>
              <td style={styles.td}>{user.username}</td>
              <td style={styles.td}>{user.email}</td>
              <td style={styles.td}>{user.role}</td>
              <td style={styles.td}>
                <input
                  type="text"
                  name="targetClientId"
                  value={newClientMapping.targetClientId}
                  onChange={handleInputChange}
                />
              </td>
              <td style={styles.td}>
                <button onClick={() => handleAddClientMapping(user.id)}>
                  Add Mapping
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  th: {
    padding: '8px',
    textAlign: 'left',
    borderBottom: '1px solid #ddd',
  },
  td: {
    padding: '8px',
    textAlign: 'left',
    borderBottom: '1px solid #ddd',
  },
};

export default AdminScreen;