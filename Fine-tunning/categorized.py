import pandas as pd

# Load the CSV file
file_path = 'cep_metadata_04-2024.csv'
df = pd.read_csv(file_path)

# Define categorization functions
def assign_primary_category(sensor_type, function):
    if 'motion' in sensor_type.lower():
        return "Motion Detection"
    elif 'temperature' in sensor_type.lower() or 'light' in sensor_type.lower():
        return "Environmental Monitoring"
    elif 'door' in function.lower() or 'vibration' in sensor_type.lower() or 'safety' in function.lower():
        return "Security and Safety"
    elif 'appliance' in function.lower() or 'cooking' in function.lower():
        return "Appliance Monitoring"
    else:
        return "Other"

def assign_secondary_category(sensor_type, function):
    if 'motion' in sensor_type.lower():
        return "Motion Sensor"
    elif 'temperature' in sensor_type.lower():
        return "Temperature Sensor"
    elif 'light' in sensor_type.lower():
        return "Light Sensor"
    elif 'door' in function.lower():
        return "Door Sensor"
    elif 'vibration' in sensor_type.lower():
        return "Vibration Sensor"
    elif 'cooking' in function.lower():
        return "Cooking Appliance"
    else:
        return "General Sensor"

def categorize_location(room_name):
    if 'kitchen' in room_name.lower():
        return "Kitchen Area"
    elif 'bedroom' in room_name.lower():
        return "Bedroom Area"
    elif 'living' in room_name.lower():
        return "Living Room Area"
    else:
        return "Other Area"

# Apply categorization
df['Primary Category'] = df.apply(lambda row: assign_primary_category(row['Sensor Type'], row['FunctionUse(s)']), axis=1)
df['Secondary Category'] = df.apply(lambda row: assign_secondary_category(row['Sensor Type'], row['FunctionUse(s)']), axis=1)
df['Room Subcategory'] = df['Rooms from Homes Checklist'].apply(lambda x: categorize_location(x) if pd.notna(x) else 'Unknown')

# Handle missing data
df['Primary Category'].fillna('Unknown', inplace=True)
df['Secondary Category'].fillna('Unknown', inplace=True)
df['Room Subcategory'].fillna('Unknown', inplace=True)

# Save the updated data to a new CSV file
output_file_path = 'updated_cep_metadata_04-2024.csv'
df.to_csv(output_file_path, index=False)

output_file_path
