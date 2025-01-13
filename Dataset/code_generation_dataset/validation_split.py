import json
import random
from pathlib import Path
from typing import Dict, List, Tuple
from sklearn.model_selection import train_test_split

# Define constants for paths
DATA_DIR = Path("C:/Users/sghar/Documents/Research-code-repo/Git/meal-prep-nu/Dataset/output")
TRAIN_FILE = DATA_DIR / "training_data.jsonl" 
VAL_FILE = DATA_DIR / "validation_data.jsonl"

class DatasetSplitter:
    def __init__(self, val_size: float = 0.2, random_state: int = 42):
        self.data_path = TRAIN_FILE
        self.val_size = val_size
        self.random_state = random_state
        
    def load_data(self) -> List[Dict]:
        """Load JSONL data from file."""
        data = []
        try:
            with open(self.data_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        data.append(json.loads(line))
        except FileNotFoundError:
            print(f"File not found: {self.data_path}")
            return []
        return data

    def create_splits(self) -> Tuple[List[Dict], List[Dict]]:
        data = self.load_data()
        train_data, val_data = train_test_split(
            data,
            test_size=self.val_size, 
            random_state=self.random_state
        )
        return train_data, val_data

    def save_splits(self, train_data: List[Dict], val_data: List[Dict]):
        train_path = DATA_DIR / 'train.jsonl'
        val_path = DATA_DIR / 'val.jsonl'
        
        for path, data in [(train_path, train_data), (val_path, val_data)]:
            with open(path, 'w', encoding='utf-8') as f:
                for item in data:
                    f.write(json.dumps(item) + '\n')

def main():
    splitter = DatasetSplitter()
    train_data, val_data = splitter.create_splits()
    splitter.save_splits(train_data, val_data)
    print(f"Training examples: {len(train_data)}")
    print(f"Validation examples: {len(val_data)}")

if __name__ == "__main__":
    main()