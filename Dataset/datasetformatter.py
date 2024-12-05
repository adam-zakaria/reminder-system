import re
import json

def clean_and_format_jsonl(input_file_path, output_file_path):
    def try_fix_json_line(line):
        # Fix common formatting issues within a line
        line = line.strip()  # Remove leading/trailing whitespace
        line = re.sub(r'(?<=[}\]])(?=[^\],}\s])', ',', line)  # Add missing commas
        # Remove trailing commas if any
        line = re.sub(r',\s*([}\]])', r'\1', line)
        # Attempt to correct trailing commas and other common mistakes
        return line

    try:
        with open(input_file_path, 'r') as file:
            lines = file.readlines()

        formatted_lines = []
        for line in lines:
            line = try_fix_json_line(line)

            try:
                json_object = json.loads(line)
                formatted_lines.append(json_object)
            except json.JSONDecodeError:
                # If a line still cannot be parsed, attempt to correct issues again
                line = try_fix_json_line(line)
                try:
                    json_object = json.loads(line)
                    formatted_lines.append(json_object)
                except json.JSONDecodeError:
                    # Skip line if it's still malformed
                    print(f"Skipping invalid JSON line due to persistent formatting issues: {line[:50]}...")

        # Write formatted JSON objects into output_file_path in JSONL format
        with open(output_file_path, 'w') as output_file:
            for json_object in formatted_lines:
                output_file.write(json.dumps(json_object) + '\n')

        print(f"Successfully formatted the JSONL file and saved to: {output_file_path}")

    except Exception as e:
        print(f"An error occurred: {str(e)}")

# Example usage
input_file_path = './code_generation_dataset/dataset.jsonl'
output_file_path = './code_generation_dataset/formatted_dataset.jsonl'
clean_and_format_jsonl(input_file_path, output_file_path)
