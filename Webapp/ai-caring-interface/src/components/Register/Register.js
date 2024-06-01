import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';

function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Role set to 'user' by default

  const handleSubmit = async () => {
    // Call the register API endpoint here
    // Include the role value in the request data
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        onChangeText={setUsername}
        value={username}
        placeholder="Username"
        style={styles.input}
        placeholderTextColor="#999"
      />
      <TextInput
        onChangeText={setEmail}
        value={email}
        placeholder="Email"
        style={styles.input}
        placeholderTextColor="#999"
      />
      <TextInput
        onChangeText={setPassword}
        value={password}
        placeholder="Password"
        secureTextEntry
        style={styles.input}
        placeholderTextColor="#999"
      />
      <Button onPress={handleSubmit} title="Register" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
  },
});

export default RegisterScreen;
