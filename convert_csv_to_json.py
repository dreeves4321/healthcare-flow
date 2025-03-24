import csv
import json
import os

# List of CSV files to convert
# Format: [('input_file.csv', 'output_file.json'), ...]
FILES_TO_CONVERT = [
    ('data/nodes.csv', 'data/nodes.json'),
    ('data/links.csv', 'data/links.json')
]

def convert_csv_to_json(csv_file, json_file):
    # Read CSV file with utf-8-sig encoding to automatically remove BOM
    with open(csv_file, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        data = list(reader)
    
    # Write JSON file
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)

def main():
    for csv_file, json_file in FILES_TO_CONVERT:
        if os.path.exists(csv_file):
            convert_csv_to_json(csv_file, json_file)
            print(f"Converted {csv_file} to {json_file}")
        else:
            print(f"Warning: {csv_file} not found, skipping...")

if __name__ == "__main__":
    main() 