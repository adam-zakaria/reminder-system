import React, { useContext, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { AuthContext } from '../../Authcontext';
import DropdownSelect from 'react-dropdown-select';

function ReminderForm({ reminder, handleChange, handleSubmit, loadingReminder, formInvalid }) {
  const { userId } = useContext(AuthContext);

  useEffect(() => {
    if (userId) {
      handleChange('userId', userId);
    }
  }, [userId]);

  const intervalOptions = [
    { value: 'everytime', label: 'Everytime' },
    { value: 'once', label: 'Once' },
  ];

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={reminder.userId}
        editable={false}
        placeholder="User ID"
      />
      <Text style={styles.hint}>Message: Enter the text for your reminder.</Text>
      <TextInput
        style={styles.input}
        onChangeText={(value) => handleChange('message', value)}
        value={reminder.message}
        placeholder="Message"
      />
      <Text style={styles.hint}>Interval: Can be like 'Everytime', 'Once'.</Text>
      <DropdownSelect
        options={intervalOptions}
        onChange={(value) => handleChange('interval', value.value)}
        value={intervalOptions.find((option) => option.value === reminder.interval?.toLowerCase()) || null}
        placeholder="Select an interval"
        style={styles.dropdown}
      />
      <Text style={styles.hint}>Time: Enter the date and time in this format: 2024-03-27T07:00:00.000Z.</Text>
      <TextInput
        style={styles.input}
        onChangeText={(value) => handleChange('time', value)}
        value={reminder.time}
        placeholder="Time"
      />
      <Text style={styles.hint}>Utility Name: Enter the name of the utility (e.g., fridge, microwave).</Text>
      <TextInput
        style={styles.input}
        onChangeText={(value) => handleChange('utility_name', value)}
        value={reminder.utility_name}
        placeholder="Utility Name"
      />
      <Text style={styles.hint}>Component Name: Enter the component of the utility (e.g., door, power).</Text>
      <TextInput
        style={styles.input}
        onChangeText={(value) => handleChange('component_name', value)}
        value={reminder.component_name}
        placeholder="Component Name"
      />
      <Text style={styles.hint}>Condition: Enter the condition for the reminder (e.g., door open, door close).</Text>
      <TextInput
        style={styles.input}
        onChangeText={(value) => handleChange('condition', value)}
        value={reminder.condition}
        placeholder="Condition"
      />
      <Text style={styles.hint}>Delay: Enter the number of seconds to wait before triggering the reminder.</Text>
      <TextInput
        style={styles.input}
        onChangeText={(value) => handleChange('delay', value)}
        value={reminder.delay}
        placeholder="Delay"
      />
      <Text style={styles.hint}>Display: Enter the text to be shown on the device when the reminder is triggered.</Text>
      <TextInput
        style={styles.input}
        onChangeText={(value) => handleChange('display', value)}
        value={reminder.display}
        placeholder="Display"
      />
      <DropdownSelect
        options={[
          { value: 'true', label: 'Disappear on Condition' },
          { value: 'false', label: 'Do Not Disappear' },
        ]}
        onChange={(value) => handleChange('disappearOnCondition', value.value)}
        value={{ value: reminder.disappearOnCondition, label: reminder.disappearOnCondition === 'true' ? 'Disappear on Condition' : 'Do Not Disappear' }}
        placeholder="Select an option"
        style={styles.dropdown}
      />
      <Button
        onPress={handleSubmit}
        title="Create Reminder"
        disabled={loadingReminder || formInvalid()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  hint: {
    fontSize: 12,
    color: 'gray',
    marginBottom: 4,
  },
  dropdown: {
    marginBottom: 8,
  },
});

export default ReminderForm;
