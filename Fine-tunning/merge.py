import json

# List of all the converted JSONL files
input_files = [
    './converted_Dataset_1.jsonl',
    './converted_Dataset_2.jsonl',
    './converted_Dataset_3.jsonl',
    './converted_DataSet_4.jsonl',
    './converted_DataSet_5.jsonl',
    './converted_DataSet_6.jsonl',
    './converted_DataSet_7.jsonl',
    './converted_DataSet_8.jsonl',
    './converted_DataSet_9.jsonl',
    './converted_DataSet_10.jsonl'
    
]

output_file = 'C:/Users/sghar/Documents/Research-code-repo/Git/meal-prep-nu/Fine-tunning/Final_Training_dataset.jsonl'

# Merging the files
with open(output_file, 'w') as outfile:
    for file in input_files:
        with open(file, 'r') as infile:
            for line in infile:
                outfile.write(line)

print(f'Merged dataset saved to {output_file}')
