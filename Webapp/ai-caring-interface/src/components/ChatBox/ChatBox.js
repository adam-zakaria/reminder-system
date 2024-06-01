import React, { useState } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';
import api from '../../utils/api';

function ChatBox({ onChatResponse }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);

  const sendMessageToAPI = async (message) => {
    try {
      const _response = await api.post('/chat', { message, sessionId });
      const { sessionId: newSessionId, response } = _response.data;
      setSessionId(newSessionId);
      const userMessage = { text: message, sender: 'You' };
      const assistantMessage = { text: response.assistant, sender: 'Assistant' };
      setMessages((prevMessages) => [...prevMessages, userMessage, assistantMessage]);
  
      // Pass the response data to the parent component
      if (onChatResponse) {
        onChatResponse(response);
      }
    } catch (error) {
      console.error('Error sending message to API:', error);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() !== '') {
      sendMessageToAPI(newMessage);
      setNewMessage('');
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.messageContainer, item.sender === 'You' ? styles.userMessage : styles.botMessage]}>
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.chatContainer}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          onSubmitEditing={sendMessage}
        />
        <Button title="Send" onPress={sendMessage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatContainer: {
    paddingVertical: 16,
  },
  messageContainer: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  userMessage: {
    backgroundColor: '#e6e6e6',
    alignSelf: 'flex-end',
    marginRight: 16,
  },
  botMessage: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-start',
    marginLeft: 16,
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  messageInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 8,
  },
});

export default ChatBox;