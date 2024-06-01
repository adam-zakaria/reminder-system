// Login.js
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    // Call the login API endpoint here
  };

  return (
    <View>
      <TextInput onChangeText={setEmail} value={email} placeholder="Email" />
      <TextInput onChangeText={setPassword} value={password} placeholder="Password" secureTextEntry />
      <Button onPress={handleSubmit} title="Login" />
    </View>
  );
}

export default Login;
