import React, { useContext, useEffect, useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import { AuthContext } from '../../Authcontext';
import Select from 'react-select';
import { api } from '../../utils/api';

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
  const [lightCategoriesOptions, setLightCategoriesOptions] = useState([]);

  useEffect(() => {
    if (userId) {
      handleChange('userId', userId);
    }

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

    api
      .get('/api/light-categories')
      .then(response => {
        const categories = response.data.map(category => ({
          value: category.id,  // Use category.id which is an integer
          label: category.label,
          color: category.color,
        }));
        setLightCategoriesOptions(categories);
      })
      .catch(error => {
        console.error('Error fetching light categories:', error);
      });
  }, [userId]);

  const getSelectedOption = (options, value) => {
    if (value === null || value === undefined) return null;
    return options.find(option => option.value === value) || null;  // Directly compare the integer values
  };

  const selectedIntervalOption = getSelectedOption(intervalOptions, reminder.interval);
  const selectedDisappearOption = getSelectedOption(disappearOptions, reminder.disappearOnCondition);
  const selectedTriggerTypeOption = getSelectedOption(triggerTypeOptions, reminder.triggerType);
  const selectedActivityOption = activityTypes.find(
    (option) => option.value.toLowerCase() === (reminder.activity || '').toLowerCase()
  );
  const selectedLightCategoryOption = getSelectedOption(lightCategoriesOptions, reminder.lightCategoryId);

  const getStyle = (field) => (submitted && invalidFields.includes(field) ? styles.inputInvalid : styles.input);

  const getHintText = (field) => {
    switch (field) {
      case 'message':
        return 'Enter the text for your reminder.';
      case 'interval':
        return 'Interval: Can be like "Everytime" or "Once".';
      case 'time':
        return 'Time is required for a non-dependent reminder.';
      case 'utility_name':
        return 'Utility Name is required for a dependent reminder.';
      case 'component_name':
        return 'Component Name is required for a dependent reminder.';
      case 'condition':
        return 'Condition is required for a dependent reminder.';
      case 'delay':
        return 'Enter the number of seconds to wait before triggering the reminder.';
      case 'display':
        return 'Enter the text to be shown on the device when the reminder is triggered.';
      case 'disappearOnCondition':
        return 'Select if the reminder should disappear on condition.';
      case 'activity':
        return 'Activity is required for an activity-based reminder.';
      case 'triggerTime':
        return 'Trigger Time is required for an activity-based reminder.';
      case 'triggerType':
        return 'Trigger Type is required for an activity-based reminder.';
      case 'lightCategoryId':
        return 'Select the category for the lights.';
      default:
        return '';
    }
  };

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
    }),
    singleValue: (provided, state) => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
    }),
  };

  const Option = (props) => (
    <div {...props.innerProps} style={{ display: 'flex', alignItems: 'center' }}>
      <div
        style={{
          width: 16,
          height: 16,
          backgroundColor: props.data.color,
          borderRadius: '50%',
          marginRight: 8,
        }}
      />
      <span>{props.data.label}</span>
    </div>
  );

  const SingleValue = (props) => (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div
        style={{
          width: 16,
          height: 16,
          backgroundColor: props.data.color,
          borderRadius: '50%',
          marginRight: 8,
        }}
      />
      <span>{props.data.label}</span>
    </div>
  );

  return (
    <View style={styles.container}>
      {submitted && invalidFields.length > 0 && (
        <Text style={styles.errorText}>Please fill in all required fields correctly.</Text>
      )}
      <Text style={styles.hint}>{getHintText('message')}</Text>
      <TextInput
        style={getStyle('message')}
        onChangeText={(value) => handleChange('message', value)}
        value={reminder.message}
        placeholder="Message"
      />
      <Text style={styles.hint}>{getHintText('interval')}</Text>
      <Select
        options={intervalOptions}
        onChange={(value) => handleChange('interval', value.value)}
        value={selectedIntervalOption}
        placeholder={selectedIntervalOption?.label || "Select an interval"}
        styles={customStyles}
        components={{ Option }}
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
      <Text style={styles.hint}>{getHintText('delay')}</Text>
      <TextInput
        style={getStyle('delay')}
        onChangeText={(value) => handleChange('delay', value)}
        value={reminder.delay}
        placeholder="Delay"
      />
      <Text style={styles.hint}>{getHintText('display')}</Text>
      <TextInput
        style={getStyle('display')}
        onChangeText={(value) => handleChange('display', value)}
        value={reminder.display}
        placeholder="Display"
      />
      <Text style={styles.hint}>{getHintText('disappearOnCondition')}</Text>
      <Select
        options={disappearOptions}
        onChange={(value) => handleChange('disappearOnCondition', value.value)}
        value={selectedDisappearOption}
        placeholder={selectedDisappearOption?.label || "Select an option"}
        styles={customStyles}
      />
      <Text style={styles.hint}>{getHintText('activity')}</Text>
      <Select
        options={activityTypes}
        onChange={(value) => handleChange('activity', value.value)}
        value={selectedActivityOption}
        placeholder={selectedActivityOption ? selectedActivityOption.label : 'Select an activity'}
        styles={customStyles}
      />
      <Text style={styles.hint}>{getHintText('triggerTime')}</Text>
      <TextInput
        style={getStyle('triggerTime')}
        onChangeText={(value) => handleChange('triggerTime', value)}
        value={reminder.triggerTime}
        placeholder="Trigger Time (seconds)"
      />
      <Text style={styles.hint}>{getHintText('triggerType')}</Text>
      <Select
        options={triggerTypeOptions}
        onChange={(value) => handleChange('triggerType', value.value)}
        value={selectedTriggerTypeOption}
        placeholder={selectedTriggerTypeOption?.label || "Select trigger type"}
        styles={customStyles}
      />
      <Text style={styles.hint}>{getHintText('lightCategoryId')}</Text>
      <Select
        options={lightCategoriesOptions}
        onChange={(value) => handleChange('lightCategoryId', value.value)}
        value={selectedLightCategoryOption}
        placeholder={selectedLightCategoryOption?.label || "Select a light category"}
        styles={customStyles}
        components={{ Option, SingleValue }}
      />
      <View style={styles.buttonContainer}>
        <Button
          onPress={handleSubmit}
          title={isEditing ? "Update Reminder" : "Create Reminder"}
          disabled={loadingReminder}
        />
      </View>
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
    marginVertical: 8,
    backgroundColor: '#f5f5f5',
  },
  inputInvalid: {
    height: 40,
    borderColor: 'red',
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginVertical: 8,
    backgroundColor: '#f5e6e6',
  },
  hint: {
    fontSize: 12,
    color: 'gray',
    marginBottom: 4,
  },
  dropdown: {
    marginVertical: 8,
  },
  errorText: {
    color: 'red',
    marginBottom: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 16,
  },
});

export default ReminderForm;
