import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../../screens/HomeScreen/HomeScreen';
import RemindersScreen from '../../screens/RemindersScreen/RemindersScreen';
import LogoutScreen from '../../screens/LogoutScreen/LogoutScreen';

const Stack = createStackNavigator();

const AuthenticatedStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Reminders" component={RemindersScreen} />
    <Stack.Screen name="Logout" component={LogoutScreen} />
  </Stack.Navigator>
);

export default AuthenticatedStack;