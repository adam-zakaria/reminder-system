import json
import os

def process_single_conversation_file(data):
    """
    Process a single conversation file and return it in the required format.
    """
    if 'messages' in data:
        return {"messages": data['messages']}
    elif 'conversations' in data:
        messages = []
        for conversation in data['conversations']:
            if 'role' in conversation and 'content' in conversation:
                messages.append({
                    "role": conversation['role'],
                    "content": conversation['content']['text']
                })
        return {"messages": messages}

def process_files(input_dir, output_file_path, dataset_files):
    """
    Process multiple dataset files, each containing a single conversation,
    and save them into a single JSONL file.
    """
    all_formatted_data = []

    for dataset_file in dataset_files:
        file_path = os.path.join(input_dir, dataset_file)
        with open(file_path, 'r') as f:
            data = json.load(f)
            formatted_data = process_single_conversation_file(data)
            all_formatted_data.append(formatted_data)
    
    # Write the formatted data to a JSONL file
    with open(output_file_path, 'w') as f_out:
        for item in all_formatted_data:
            f_out.write(json.dumps(item) + "\n")

    print(f"Processed {len(dataset_files)} files and saved to {output_file_path}")

if __name__ == "__main__":
    input_dir = "C:/Users/sghar/Documents/Research-code-repo/Git/meal-prep-nu/Fine-tunning"  # Update this to your directory path
    output_file_path = "C:/Users/sghar/Documents/Research-code-repo/Git/meal-prep-nu/Fine-tunning/Training_dataset.jsonl"  # Update this to your desired output path
    dataset_files = [
        "Dataset_1.json",
        "Dataset_2.json",
        "Dataset_3.json",
        "DataSet_4.json",
        "DataSet_5.json",
        "DataSet_6.json",
        "DataSet_7.json"
    ]

    process_files(input_dir, output_file_path, dataset_files)
