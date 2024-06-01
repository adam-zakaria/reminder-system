// TabNavigator.js
import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import HomeScreen from '../HomeScreen/HomeScreen';
import RemindersScreen from '..//RemindersScreen/RemindersScreen';
import LogoutScreen from '../LogoutScreen/LogoutScreen';

const Tab = createMaterialTopTabNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      tabBarActiveTintColor: 'tomato',
      tabBarInactiveTintColor: 'gray',
      tabBarIndicatorStyle: { backgroundColor: 'tomato' },
      tabBarStyle: { backgroundColor: 'white' },
    }}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Reminders" component={RemindersScreen} />
    <Tab.Screen name="Logout" component={LogoutScreen} />
  </Tab.Navigator>
);

export default TabNavigator;