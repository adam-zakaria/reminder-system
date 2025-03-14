import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, ScrollView, Text } from 'react-native';
// Import the library for making API requests (e.g., axios, fetch)
import axios from 'axios';

function ChatAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (input) {
      setMessages([...messages, { text: input, sender: 'user' }]);
      setInput('');

      try {
        // Call your chat assistant API with the user's input message
        const response = await axios.post('/api/chat-assistant', { message: input });
        const assistantResponse = response.data.response;

        // Add the assistant's response to the messages array
        setMessages([...messages, { text: assistantResponse, sender: 'assistant' }]);
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.chatBox}>
        <ScrollView style={styles.messagesContainer}>
          {messages.map((message, index) => (
            <Text key={index} style={styles.message(message.sender)}>
              {message.text}
            </Text>
          ))}
        </ScrollView>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message"
        />
        <Button title="Send" onPress={handleSend} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  chatBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  messagesContainer: {
    flex: 1,
    maxHeight: '80%', // Adjust the maximum height as needed
  },
  message: (sender) => ({
    alignSelf: sender === 'user' ? 'flex-end' : 'flex-start',
    backgroundColor: sender === 'user' ? '#0084ff' : '#f0f0f0',
    borderRadius: 20,
    margin: 5,
    padding: 10,
    maxWidth: '70%', // Adjust the maximum width as needed
  }),
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
  },
  input: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
    marginRight: 10,
  },
});

export default ChatAssistant;