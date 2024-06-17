import React, { useContext, useEffect, useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { AuthContext } from '../../Authcontext';
import DropdownSelect from 'react-dropdown-select';
import api from '../../utils/api';

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
    { value: 'begin', label: 'Begin' },
    { value: 'end', label: 'End' },
  ];

  const [activityTypes, setActivityTypes] = useState([]);

  useEffect(() => {
    if (userId) {
      handleChange('userId', userId);
    }

    // Fetch activity types from the API
    api
      .get('/activities')
      .then(response => {
        const activities = response.data.map(activity => ({
          value: activity.name,
          label: activity.name,
        }));
        setActivityTypes(activities);
      })
      .catch(error => {
        console.error('Error fetching activity types:', error);
      });
  }, [userId]);

  const getSelectedOption = (options, value) => {
    if (!value) return null;
    const lowerCaseValue = value.toString().toLowerCase();
    return options.find(option => option.value === lowerCaseValue) || null;
  };

  const selectedIntervalOption = getSelectedOption(intervalOptions, reminder.interval);
  const selectedDisappearOption = getSelectedOption(disappearOptions, reminder.disappearOnCondition);
  const selectedTriggerTypeOption = getSelectedOption(triggerTypeOptions, reminder.triggerType);
  const selectedActivityOption = activityTypes.find(
    (option) => option.value.toLowerCase() === (reminder.activity || '').toLowerCase()
  );

  const getStyle = (field) => (submitted && invalidFields.includes(field) ? styles.inputInvalid : styles.input);

  const getHintText = (field) => {
    switch (field) {
      case 'time':
        return reminder.time ? '' : 'Time is required for a non-dependent reminder.';
      case 'utility_name':
        return reminder.utility_name ? '' : 'Utility Name is required for a dependent reminder.';
      case 'component_name':
        return reminder.component_name ? '' : 'Component Name is required for a dependent reminder.';
      case 'condition':
        return reminder.condition ? '' : 'Condition is required for a dependent reminder.';
      case 'activity':
        return reminder.activity ? '' : 'Activity is required for an activity-based reminder.';
      case 'triggerTime':
        return reminder.triggerTime ? '' : 'Trigger Time is required for an activity-based reminder.';
      case 'triggerType':
        return reminder.triggerType ? '' : 'Trigger Type is required for an activity-based reminder.';
      default:
        return '';
    }
  };

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
      <Text style={styles.hint}>{getHintText('time')}</Text>
      <TextInput
        style={getStyle('time')}
        onChangeText={(value) => handleChange('time', value)}
        value={reminder.time}
        placeholder="Time"
      />
      <Text style={styles.hint}>{getHintText('utility_name')}</Text>
      <TextInput
        style={getStyle('utility_name')}
        onChangeText={(value) => handleChange('utility_name', value)}
        value={reminder.utility_name}
        placeholder="Utility Name"
      />
      <Text style={styles.hint}>{getHintText('component_name')}</Text>
      <TextInput
        style={getStyle('component_name')}
        onChangeText={(value) => handleChange('component_name', value)}
        value={reminder.component_name}
        placeholder="Component Name"
      />
      <Text style={styles.hint}>{getHintText('condition')}</Text>
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
      <Text style={styles.hint}>{getHintText('activity')}</Text>
      <DropdownSelect
        options={activityTypes}
        onChange={(value) => handleChange('activity', value[0].value)}
        value={selectedActivityOption ? [selectedActivityOption] : []}
        placeholder={selectedActivityOption ? selectedActivityOption.label : 'Select an activity'}
        style={styles.dropdown}
      />
      <Text style={styles.hint}>{getHintText('triggerTime')}</Text>
      <TextInput
        style={getStyle('triggerTime')}
        onChangeText={(value) => handleChange('triggerTime', value)}
        value={reminder.triggerTime}
        placeholder="Trigger Time (seconds)"
      />
      <Text style={styles.hint}>{getHintText('triggerType')}</Text>
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