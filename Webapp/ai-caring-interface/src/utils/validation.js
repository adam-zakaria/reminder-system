export const validateReminderForm = (reminder) => {
    const invalid = [];
    const { userId, message, interval, display, time, utility_name, component_name, condition, delay, activity, triggerTime, triggerType, type, lightCategoryId } = reminder;
  
    if (!userId) invalid.push('userId');
    if (!message) invalid.push('message');
    if (!interval) invalid.push('interval');
    if (!display) invalid.push('display');
    if (!lightCategoryId) invalid.push('lightCategory')
  
    if (type === 'General') {
      if (!time) invalid.push('time');
      if (utility_name || component_name || condition || delay || activity || triggerTime || triggerType) {
        invalid.push('utility_name', 'component_name', 'condition', 'delay', 'activity', 'triggerTime', 'triggerType');
      }
    } else if (type === 'Utility') {
      if (!utility_name) invalid.push('utility_name');
      if (!component_name) invalid.push('component_name');
      if (!condition) invalid.push('condition');
      if (!delay) invalid.push('delay');
      if (time || activity || triggerTime || triggerType) {
        invalid.push('time', 'activity', 'triggerTime', 'triggerType');
      }
    } else if (type === 'Activity') {
      if (!activity) invalid.push('activity');
      if (!triggerTime) invalid.push('triggerTime');
      if (!triggerType) invalid.push('triggerType');
      if (time || utility_name || component_name || condition || delay) {
        invalid.push('time', 'utility_name', 'component_name', 'condition', 'delay');
      }
    }
  
    return invalid;
  };