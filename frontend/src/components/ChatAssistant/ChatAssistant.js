import React, { useState } from 'react';
import ChatBot from 'react-simple-chatbot';
import { StyleSheet, View, Text } from 'react-native';
import axios from 'axios';

const ChatBotComponent = () => {
  const [steps, setSteps] = useState([
    {
      id: '1',
      message: 'Hello, how can I assist you today?',
      trigger: 'user-message',
    },
    {
      id: 'user-message',
      user: true,
      trigger: 'processing',
    },
    {
      id: 'processing',
      component: (
        <View style={styles.messageContainer}>
          <Text>I received your message. Let me process it and get back to you shortly.</Text>
        </View>
      ),
      asMessage: true,
      trigger: 'fetch-response',
    },
    {
      id: 'fetch-response',
      message: 'Please wait while I fetch the response...',
      end: true,
    },
  ]);

  const handleEnd = async ({ steps, values }) => {
    const userMessage = values[0];
    try {
      const response = await axios.post('http://localhost:7628/chat', { message: userMessage });
      const assistantMessage = response.data.response;
      setSteps(prevSteps => {
        const newSteps = prevSteps.map(step => {
          if (step.id === 'fetch-response') {
            return {
              ...step,
              message: assistantMessage,
              trigger: 'user-message',
            };
          }
          return step;
        });
        return newSteps;
      });
    } catch (error) {
      console.error('Error fetching response from backend:', error);
    }
  };

  return (
    <View style={styles.chatContainer}>
      <ChatBot
        steps={steps}
        headerTitle="Chat Assistant"
        handleEnd={handleEnd}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    width: '50%', // Adjust the width to take up half the screen
    backgroundColor: '#fff',
    borderRadius: 10,
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  messageContainer: {
    padding: 16,
    alignItems: 'center',
  },
});

export default ChatBotComponent;
