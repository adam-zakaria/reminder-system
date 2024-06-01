import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import ChatAssistant from '../ChatAssistant/ChatAssistant';

const SideChat = () => {
  const [showChat, setShowChat] = useState(false);

  const toggleChat = () => {
    setShowChat(!showChat);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.toggleButton} onPress={toggleChat}>
        <Text style={styles.toggleButtonText}>{showChat ? 'Hide Chat' : 'Show Chat'}</Text>
      </TouchableOpacity>
      {showChat && (
        <View style={styles.chatContainer}>
          <ChatAssistant />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flex: 1,
  },
  toggleButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1,
  },
  toggleButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  chatContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    height: '100%',
    width: 300,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#CCCCCC',
    padding: 16,
    zIndex: 2,
  },
});

export default SideChat;