import React, { useState, useEffect, useContext } from 'react';
import { FlatList, View, TextInput, TouchableOpacity } from 'react-native';
import Avatar from 'react-avatar';
import { FaPaperPlane } from 'react-icons/fa';
import styled from 'styled-components/native';
import { AuthContext } from '../../Authcontext';
import { jwtDecode } from 'jwt-decode';
import api from '../../utils/api';

const Container = styled.View`
  flex: 1;
  background-color: #fff;
`;

const MessageContainer = styled.View`
  flex-direction: row;
  align-items: flex-start;
  margin-vertical: 4px;
  margin-horizontal: 16px;
  max-width: 80%;
  align-self: ${({ sender }) => (sender === 'You' ? 'flex-end' : 'flex-start')};
`;

const MessageBubble = styled.View`
  padding: 12px;
  border-radius: 8px;
  background-color: ${({ sender }) => (sender === 'You' ? '#e6e6e6' : '#dcf8c6')};
  margin-left: ${({ sender }) => (sender === 'You' ? 8 : 0)}px;
  margin-right: ${({ sender }) => (sender === 'You' ? 0 : 8)}px;
  flex-shrink: 1;
`;

const MessageText = styled.Text`
  font-size: 16px;
  flex-shrink: 1; 
  flex-wrap: wrap;
`;

const InputContainer = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 8px;
  border-top-width: 1px;
  border-top-color: #ccc;
`;

const MessageInput = styled.TextInput`
  flex: 1;
  height: 40px;
  border-width: 1px;
  border-color: #ccc;
  border-radius: 20px;
  padding-horizontal: 12px;
  margin-right: 8px;
`;

const SendButton = styled.TouchableOpacity`
  padding: 8px;
`;

function ChatBox({ onChatResponse }) {
  const [messages, setMessages] = useState([
    { text: 'Hi there! Let me know what you\'d like me to remind you about.', sender: 'Assistant' },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useContext(AuthContext);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsTyping(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isTyping]);

  useEffect(() => {
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const userId = decodedToken.userId;
        console.log(userId, "userId");
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, [token]);

  const sendMessageToAPI = async (message) => {
    setIsLoading(true);
    const decodedToken = token ? jwtDecode(token) : null;
    const userId = decodedToken ? decodedToken.userId : null;

    try {
      const _response = await api.post('/chat', { message, sessionId, userId });
      const { sessionId: newSessionId, response } = _response.data;
      setSessionId(newSessionId);
      const assistantMessage = { text: response.assistant, sender: 'Assistant' };
      setMessages((prevMessages) => {
        const updatedMessages = prevMessages.filter(msg => msg.text !== '...');
        return [...updatedMessages, assistantMessage];
      });

      if (onChatResponse) {
        onChatResponse(response);
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
    }
  };

  const renderMessage = ({ item }) => (
    <MessageContainer sender={item.sender}>
      {item.sender !== 'You' && (
        <Avatar
          name="Assistant"
          round={true}
          size="40"
          style={{ marginRight: 8 }}
        />
      )}
      <MessageBubble sender={item.sender}>
        <MessageText>{item.text}</MessageText>
      </MessageBubble>
      {item.sender === 'You' && (
        <Avatar
          name="You"
          round={true}
          size="40"
          style={{ marginLeft: 8 }}
        />
      )}
    </MessageContainer>
  );

  return (
    <Container>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingVertical: 16 }}
      />
      <InputContainer>
        <MessageInput
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          onSubmitEditing={sendMessage}
        />
        <SendButton onPress={sendMessage}>
          <FaPaperPlane size={24} color="#333" />
        </SendButton>
      </InputContainer>
    </Container>
  );
}

export default ChatBox;
