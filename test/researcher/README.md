# Setup todo
* The imports are a mess - pipenv shell must be done in bots, utils is not installed in that env, a lot of sys.path.import. the .env is not loaded properly.
* add dynamic path creation:
am I right to think that dynamically created absolutel paths are kind of the best path solution? For python projects, relative paths break depending on where a script is run from. Absolute paths break if the project is executed on another system. However, absolute paths can be created by dynamically generating everything before the repo path and then just adding the internal repo path (which doesnt change system to system)

# Sensor Update Test Files

This directory contains sensor update files that test various reminders. Each file corresponds to a specific reminder trigger condition.

## File Mapping

1. `1.json` - Kitchen entry (water plants)
2. `2.json` - Bathroom entry (take vitamins)
3. `3.json` - Bedroom entry at night (turn off living room lights)
4. `4.json` - Front door exit (check windows)
5. `5.json` - Living room entry in morning (open curtains)
6. `6.json` - Bedroom temperature high (turn on fan)
7. `7.json` - Office entry (check calendar)
8. `8.json` - Garage entry (check car lock)
9. `9.json` - Bathroom humidity high (turn on exhaust fan)
10. `10.json` - Dining room entry (set table)
11. `11.json` - Morning medication time (8:00 AM)
12. `12.json` - Lunch break time (12:30 PM)
13. `13.json` - Afternoon medication time (3:00 PM)
14. `14.json` - Evening medication time (8:00 PM)
15. `15.json` - Bedtime medication time (10:00 PM)
16. `16.json` - Morning exercise time (7:00 AM)
17. `17.json` - Blood pressure check time (9:00 AM)
18. `18.json` - Afternoon walk time (4:00 PM)
19. `19.json` - Evening walk time (7:00 PM)
20. `20.json` - Bedtime preparation time (9:30 PM)

## Reminder Details

```json
{
  "1": {
    "filename": "1.json",
    "reminder": "When I enter the kitchen, remind me to water the plants",
    "trigger": "motion in kitchen"
  },
  "2": {
    "filename": "2.json",
    "reminder": "When I enter the bathroom, remind me to take my vitamins",
    "trigger": "motion in bathroom"
  },
  "3": {
    "filename": "3.json",
    "reminder": "When I enter the bedroom at night, remind me to turn off the living room lights",
    "trigger": "motion in bedroom after 10 PM"
  },
  "4": {
    "filename": "4.json",
    "reminder": "When I leave the house, remind me to check if all the windows are closed",
    "trigger": "motion exit at front door"
  },
  "5": {
    "filename": "5.json",
    "reminder": "When I enter the living room in the morning, remind me to open the curtains",
    "trigger": "motion in living room before noon"
  },
  "6": {
    "filename": "6.json",
    "reminder": "When the temperature in my bedroom is above 75°F, remind me to turn on the fan",
    "trigger": "temperature > 75°F in bedroom"
  },
  "7": {
    "filename": "7.json",
    "reminder": "When I enter the office, remind me to check my calendar",
    "trigger": "motion in office"
  },
  "8": {
    "filename": "8.json",
    "reminder": "When I enter the garage, remind me to check if the car is locked",
    "trigger": "motion in garage"
  },
  "9": {
    "filename": "9.json",
    "reminder": "When the humidity in my bathroom is above 70%, remind me to turn on the exhaust fan",
    "trigger": "humidity > 70% in bathroom"
  },
  "10": {
    "filename": "10.json",
    "reminder": "When I enter the dining room, remind me to set the table",
    "trigger": "motion in dining room"
  },
  "11": {
    "filename": "11.json",
    "reminder": "At 8:00 AM, remind me to take my morning medication",
    "trigger": "time 08:00"
  },
  "12": {
    "filename": "12.json",
    "reminder": "At 12:30 PM, remind me to take my lunch break",
    "trigger": "time 12:30"
  },
  "13": {
    "filename": "13.json",
    "reminder": "At 3:00 PM, remind me to take my afternoon medication",
    "trigger": "time 15:00"
  },
  "14": {
    "filename": "14.json",
    "reminder": "At 8:00 PM, remind me to take my evening medication",
    "trigger": "time 20:00"
  },
  "15": {
    "filename": "15.json",
    "reminder": "At 10:00 PM, remind me to take my bedtime medication",
    "trigger": "time 22:00"
  },
  "16": {
    "filename": "16.json",
    "reminder": "At 7:00 AM, remind me to do my morning exercise",
    "trigger": "time 07:00"
  },
  "17": {
    "filename": "17.json",
    "reminder": "At 9:00 AM, remind me to check my blood pressure",
    "trigger": "time 09:00"
  },
  "18": {
    "filename": "18.json",
    "reminder": "At 4:00 PM, remind me to go for my afternoon walk",
    "trigger": "time 16:00"
  },
  "19": {
    "filename": "19.json",
    "reminder": "At 7:00 PM, remind me to go for my evening walk",
    "trigger": "time 19:00"
  },
  "20": {
    "filename": "20.json",
    "reminder": "At 9:30 PM, remind me to prepare for bed",
    "trigger": "time 21:30"
  }
}
``` 