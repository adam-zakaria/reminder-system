import pandas as pd
import ast

# Load the Excel file
file_path = 'your_file_path_here.xlsx'  # Replace with the actual file path
df = pd.read_excel(file_path)

# Function to extract text fields from the Response column
def extract_text_from_response(response):
    try:
        # Parse the response string to a list of dictionaries
        response_list = ast.literal_eval(response)
        # Extract text fields from the list of dictionaries
        text_values = [entry['text'] for entry in response_list if 'text' in entry]
        # Join them into a single string
        return " ".join(text_values)
    except (ValueError, SyntaxError):
        return response

# Apply the function to the 'Response' column
df['Parsed Response'] = df['Response'].apply(extract_text_from_response)

# Display the modified dataframe
print(df.head())

# Optionally, save the updated DataFrame to a new Excel file
# df.to_excel('parsed_reminders_dataset.xlsx', index=False)