import pandas as pd
import json
import os

def convert_excel_to_jsonl():
    # Get absolute paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    excel_file = os.path.join(script_dir, 'code_generation_dataset', 'Dataset.xlsx')
    output_file = os.path.join(script_dir, 'output', 'training_data.jsonl')
    
    # Ensure the Excel file exists
    if not os.path.exists(excel_file):
        raise FileNotFoundError(f"Excel file not found at {excel_file}")
    
    # Create output directory
    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    
    # Read Excel and get system prompt from A2
    df = pd.read_excel(excel_file)
    system_prompt = df.iloc[0]['_prompt']  # Get system prompt from first row
    
    # Convert to JSONL format
    with open(output_file, 'w', encoding='utf-8') as f:
        for _, row in df.iterrows():
            entry = {
                "messages": [
                    {
                        "role": "system",
                        "content": system_prompt
                    },
                    {
                        "role": "user",
                        "content": f"{row['task_json']}"
                    },
                    {
                        "role": "assistant",
                        "content": row['assistant_code']
                    }
                ]
            }
            f.write(json.dumps(entry) + '\n')

if __name__ == "__main__":
    convert_excel_to_jsonl()