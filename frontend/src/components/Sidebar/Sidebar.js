import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  Collapse 
} from '@mui/material';
import { 
  Home as HomeIcon, 
  Person as PersonIcon, 
  Notifications as NotificationsIcon, 
  Settings as SettingsIcon, 
  ExitToApp as ExitToAppIcon, 
  ExpandLess, 
  ExpandMore, 
  Group as GroupIcon, 
  List as ListIcon, 
  Visibility as VisibilityIcon, 
  Menu as MenuIcon 
} from '@mui/icons-material';
import styles from './Sidebar.module.css';
import { AuthContext } from '../../Authcontext';

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { role, clearAuthData } = useContext(AuthContext);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    clearAuthData();
  };

  const toggleAdminDropdown = () => {
    setAdminDropdownOpen(!adminDropdownOpen);
  };

  return (
    <Drawer
      variant="permanent"
      className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}`}
      classes={{ paper: `${styles.sidebar} ${isCollapsed ? styles.collapsed : ''}` }}
    >
      <IconButton onClick={toggleSidebar} className={styles.toggleButton} style={{ color: '#ecf0f1' }}>
        <MenuIcon />
      </IconButton>
      <List className={styles.menu}>
        <ListItem button component={Link} to="/home">
          <ListItemIcon style={{ color: '#ecf0f1' }}>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Home" className={styles.menuItemText} />
        </ListItem>
        {role === 'superuser' && (
          <>
            <ListItem button onClick={toggleAdminDropdown}>
              <ListItemIcon style={{ color: '#ecf0f1' }}>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText primary="Admin" className={styles.menuItemText} />
              {adminDropdownOpen ? <ExpandLess style={{ color: '#ecf0f1' }} /> : <ExpandMore style={{ color: '#ecf0f1' }} />}
            </ListItem>
            <Collapse in={adminDropdownOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding className={styles.dropdownMenu}>
                <ListItem button component={Link} to="/admin/users">
                  <ListItemIcon style={{ color: '#ecf0f1' }}>
                    <GroupIcon />
                  </ListItemIcon>
                  <ListItemText primary="User Management" className={styles.menuItemText} />
                </ListItem>
                <ListItem button component={Link} to="/admin/reminders">
                  <ListItemIcon style={{ color: '#ecf0f1' }}>
                    <ListIcon />
                  </ListItemIcon>
                  <ListItemText primary="Reminder Management" className={styles.menuItemText} />
                </ListItem>
                <ListItem button component={Link} to="/admin/reminder-visibility">
                  <ListItemIcon style={{ color: '#ecf0f1' }}>
                    <VisibilityIcon />
                  </ListItemIcon>
                  <ListItemText primary="Reminder Visibility" className={styles.menuItemText} />
                </ListItem>
              </List>
            </Collapse>
          </>
        )}
        <ListItem button component={Link} to="/reminders">
          <ListItemIcon style={{ color: '#ecf0f1' }}>
            <NotificationsIcon />
          </ListItemIcon>
          <ListItemText primary="Reminders" className={styles.menuItemText} />
        </ListItem>
        <ListItem button component={Link} to="/reminder-library">
          <ListItemIcon style={{ color: '#ecf0f1' }}>
            <ListIcon />
          </ListItemIcon>
          <ListItemText primary="Reminder Library" className={styles.menuItemText} />
        </ListItem>
        <ListItem button component={Link} to="/" onClick={handleLogout} className={styles.logout}>
          <ListItemIcon style={{ color: '#ecf0f1' }}>
            <ExitToAppIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" className={styles.menuItemText} />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
