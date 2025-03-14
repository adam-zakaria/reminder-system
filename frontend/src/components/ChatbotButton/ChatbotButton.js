import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
//import { MaterialIcons as Icon } from '@expo/vector-icons';

const ChatBotButton = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.buttonContainer}>
        {/* <Icon name="chat" size={24} color="#fff" /> */}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  buttonContainer: {
    backgroundColor: '#2196F3',
    borderRadius: 28,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default ChatBotButton;
