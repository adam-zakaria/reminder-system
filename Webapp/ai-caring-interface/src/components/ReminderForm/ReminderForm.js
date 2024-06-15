import React, { useContext, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { AuthContext } from '../../Authcontext';
import DropdownSelect from 'react-dropdown-select';

function ReminderForm({ reminder, handleChange, handleSubmit, loadingReminder, invalidFields, isEditing, submitted }) {
  const { userId } = useContext(AuthContext);
  const intervalOptions = [
    { value: 'everytime', label: 'Everytime' },
    { value: 'once', label: 'Once' },
  ];
  const disappearOptions = [
    { value: 'true', label: 'Disappear on Condition' },
    { value: 'false', label: 'Do Not Disappear' },
  ];
  const triggerTypeOptions = [
    { value: 'immediate', label: 'Immediate' },
    { value: 'after', label: 'After' },
  ];

  useEffect(() => {
    if (userId) {
      handleChange('userId', userId);
    }
  }, [userId]);

  const getSelectedOption = (options, value) => {
    if (!value) return null;
    const lowerCaseValue = value.toString().toLowerCase();
    return options.find(option => option.value === lowerCaseValue) || null;
  };

  const selectedIntervalOption = getSelectedOption(intervalOptions, reminder.interval);
  const selectedDisappearOption = getSelectedOption(disappearOptions, reminder.disappearOnCondition);
  const selectedTriggerTypeOption = getSelectedOption(triggerTypeOptions, reminder.triggerType);

  const getStyle = (field) => (submitted && invalidFields.includes(field) ? styles.inputInvalid : styles.input);

  return (
    <View style={styles.container}>
      {submitted && invalidFields.length > 0 && (
        <Text style={styles.errorText}>Please fill in all required fields correctly.</Text>
      )}
      <Text style={styles.hint}>Message: Enter the text for your reminder.</Text>
      <TextInput
        style={getStyle('message')}
        onChangeText={(value) => handleChange('message', value)}
        value={reminder.message}
        placeholder="Message"
      />
      <Text style={styles.hint}>Interval: Can be like 'Everytime', 'Once'.</Text>
      <DropdownSelect
        options={intervalOptions}
        onChange={(value) => handleChange('interval', value[0].value)}
        value={selectedIntervalOption ? [selectedIntervalOption] : []}
        placeholder={selectedIntervalOption?.label || "Select an interval"}
        style={styles.dropdown}
      />
      <Text style={styles.hint}>Time: Enter the date and time in this format: 2024-03-27T07:00:00.000Z.</Text>
      <TextInput
        style={getStyle('time')}
        onChangeText={(value) => handleChange('time', value)}
        value={reminder.time}
        placeholder="Time"
      />
      <Text style={styles.hint}>Utility Name: Enter the name of the utility (e.g., fridge, microwave).</Text>
      <TextInput
        style={getStyle('utility_name')}
        onChangeText={(value) => handleChange('utility_name', value)}
        value={reminder.utility_name}
        placeholder="Utility Name"
      />
      <Text style={styles.hint}>Component Name: Enter the component of the utility (e.g., door, power).</Text>
      <TextInput
        style={getStyle('component_name')}
        onChangeText={(value) => handleChange('component_name', value)}
        value={reminder.component_name}
        placeholder="Component Name"
      />
      <Text style={styles.hint}>Condition: Enter the condition for the reminder (e.g., door open, door close).</Text>
      <TextInput
        style={getStyle('condition')}
        onChangeText={(value) => handleChange('condition', value)}
        value={reminder.condition}
        placeholder="Condition"
      />
      <Text style={styles.hint}>Delay: Enter the number of seconds to wait before triggering the reminder.</Text>
      <TextInput
        style={getStyle('delay')}
        onChangeText={(value) => handleChange('delay', value)}
        value={reminder.delay}
        placeholder="Delay"
      />
      <Text style={styles.hint}>Display: Enter the text to be shown on the device when the reminder is triggered.</Text>
      <TextInput
        style={getStyle('display')}
        onChangeText={(value) => handleChange('display', value)}
        value={reminder.display}
        placeholder="Display"
      />
      <DropdownSelect
        options={disappearOptions}
        onChange={(value) => handleChange('disappearOnCondition', value[0].value)}
        value={selectedDisappearOption ? [selectedDisappearOption] : []}
        placeholder={selectedDisappearOption?.label || "Select an option"}
        style={styles.dropdown}
      />
      <Text style={styles.hint}>Activity: Enter the type of activity (e.g., cooking, sleeping).</Text>
      <TextInput
        style={getStyle('activity')}
        onChangeText={(value) => handleChange('activity', value)}
        value={reminder.activity}
        placeholder="Activity"
      />
      <Text style={styles.hint}>Trigger Time: Enter the time in seconds after the activity.</Text>
      <TextInput
        style={getStyle('triggerTime')}
        onChangeText={(value) => handleChange('triggerTime', value)}
        value={reminder.triggerTime}
        placeholder="Trigger Time (seconds)"
      />
      <Text style={styles.hint}>Trigger Type: Select whether the reminder is immediate or after the trigger time.</Text>
      <DropdownSelect
        options={triggerTypeOptions}
        onChange={(value) => handleChange('triggerType', value[0].value)}
        value={selectedTriggerTypeOption ? [selectedTriggerTypeOption] : []}
        placeholder={selectedTriggerTypeOption?.label || "Select trigger type"}
        style={styles.dropdown}
      />
      <Button
        onPress={handleSubmit}
        title={isEditing ? "Update Reminder" : "Create Reminder"}
        disabled={loadingReminder}
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
  inputInvalid: {
    height: 40,
    borderColor: 'red',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 8,
    backgroundColor: '#f5e6e6',
  },
  hint: {
    fontSize: 12,
    color: 'gray',
    marginBottom: 4,
  },
  dropdown: {
    marginBottom: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default ReminderForm;
