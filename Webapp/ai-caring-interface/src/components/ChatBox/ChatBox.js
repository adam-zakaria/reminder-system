import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../Authcontext';
import { api } from '../../utils/api';
import {
  Container,
  TextField,
  IconButton,
  Grid,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import { Send as SendIcon, EmojiObjects as IdeaIcon, Alarm as AlarmIcon } from '@mui/icons-material';

const ChatBox = ({ onChatResponse }) => {
  const [messages, setMessages] = useState([
    { text: 'Hi there! Let me know what you\'d like me to remind you about.', sender: 'Assistant' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reminderLibrary, setReminderLibrary] = useState([]);
  const [examplesVisible, setExamplesVisible] = useState(true);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const fetchReminderLibrary = async () => {
      try {
        const response = await api.get('/api/reminderLibrary', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReminderLibrary(response.data.slice(0, 5)); // Limit the number of examples to 5
      } catch (error) {
        console.error('Error fetching reminder library:', error);
      }
    };
    fetchReminderLibrary();
  }, [token]);

  const sendMessageToAPI = async (message) => {
    setIsLoading(true);
    try {
      const response = await api.post('/chat', { message, sessionId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { sessionId: newSessionId, response: apiResponse } = response.data;
      setSessionId(newSessionId);
      const assistantMessage = { text: apiResponse.assistant, sender: 'Assistant' };
      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.filter(msg => msg.text !== '...');
        return [...updatedMessages, assistantMessage];
      });
      if (onChatResponse) {
        onChatResponse(apiResponse);
      }
    } catch (error) {
      console.error('Error sending message to API:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() !== '') {
      const userMessage = { text: newMessage, sender: 'You' };
      setMessages((prevMessages) => [...prevMessages, userMessage, { text: '...', sender: 'Assistant' }]);
      sendMessageToAPI(newMessage);
      setNewMessage('');
      setExamplesVisible(false); // Hide examples after sending a message
    }
  };

  const handleTileClick = (reminderText) => {
    const userMessage = { text: reminderText, sender: 'You' };
    setMessages((prevMessages) => [...prevMessages, userMessage, { text: '...', sender: 'Assistant' }]);
    sendMessageToAPI(reminderText);
    setExamplesVisible(false); // Hide examples after clicking a tile
  };

  return (
    <Container maxWidth="sm" style={{ display: 'flex', flexDirection: 'column', height: '90vh' }}>
      <Box style={{ flexGrow: 1, overflowY: 'auto' }}>
        <List>
          {messages.map((message, index) => (
            <ListItem key={index} alignItems="flex-start">
              <ListItemAvatar>
                <Avatar>{message.sender === 'You' ? 'Y' : 'A'}</Avatar>
              </ListItemAvatar>
              <ListItemText primary={message.text} />
            </ListItem>
          ))}
          {examplesVisible && (
            <Box style={{ margin: '16px 0' }}>
              <Typography variant="h6" gutterBottom>
                Examples:
              </Typography>
              <Grid container spacing={2}>
                {reminderLibrary.map((reminder, index) => (
                  <Grid item xs={12} sm={6} key={reminder.id}>
                    <Card onClick={() => handleTileClick(reminder.text)} style={{ cursor: 'pointer' }}>
                      <CardHeader
                        avatar={
                          index % 2 === 0 ? <IdeaIcon color="primary" /> : <AlarmIcon color="secondary" />
                        }
                        title={reminder.text}
                      />
                      <CardContent>
                        <Typography variant="body2" color="textSecondary">
                          {reminder.text}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </List>
      </Box>
      <Box style={{ borderTop: '1px solid #ccc', paddingTop: '8px', backgroundColor: '#fff' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
            />
          </Grid>
          <Grid item>
            <IconButton color="primary" onClick={sendMessage}>
              <SendIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ChatBox;
