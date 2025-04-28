import ast
import json
from typing import Dict, Any, Set
import os

# Define the activities
ACTIVITIES = [
    'Relax', 'Meal_Preparation', 'Leave_Home', 'Sleeping', 'Eating', 'Bed_To_Toilet', 'Enter_Home'
]

def load_sensor_mappings(file_path: str) -> Dict[str, str]:
    """
    Load sensor mappings from a JSON file.
    """
    with open(file_path, 'r') as file:
        sensor_mappings = json.load(file)
    return sensor_mappings

# Update the path to be relative to the script location
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SENSOR_MAPPING_FILE = os.path.join(BASE_DIR, 'Datastore', 'sensor_mapping.json')

# Load sensor mappings
sensor_mappings = load_sensor_mappings(SENSOR_MAPPING_FILE)

class CodeAnalyser(ast.NodeVisitor):
    VALID_STATUSES = {"begin", "end"}
    
    def __init__(self, sensor_mappings: Dict[str, str], activities: Set[str]):
        self.sensor_mappings = sensor_mappings
        self.activities = activities
        self.sensors_used = set()
        self.activities_used = []
    
    def visit_Compare(self, node):
        """Visit comparison nodes to find activity and status references"""
        activity = None
        status = None

        # Check left side of comparison
        if isinstance(node.left, ast.Call):
            if isinstance(node.left.func, ast.Attribute) and node.left.func.attr == 'get':
                if len(node.left.args) > 0 and isinstance(node.left.args[0], ast.Str):
                    key_name = node.left.args[0].s
                    if key_name == 'activity':
                        # Get the activity value
                        comparator = node.comparators[0]
                        if isinstance(comparator, ast.Str) and comparator.s in self.activities:
                            activity = comparator.s
                            print(f"Detected activity: {activity}")
                    elif key_name == 'status':
                        comparator = node.comparators[0]
                        if isinstance(comparator, ast.Str) and comparator.s in self.VALID_STATUSES:
                            status = comparator.s
                            print(f"Detected status: {status}")

        # Add or update activities_used
        if activity:
            self.activities_used.append({
                "activity": activity,
                "status": None
            })
        if status and self.activities_used:
            self.activities_used[-1]["status"] = status

        self.generic_visit(node)
    
    def visit_Str(self, node):
        # Check for direct usage of sensor variable names
        if node.s in self.sensor_mappings.values():
            self.sensors_used.add(node.s)
            #print(f"Detected sensor: {node.s}")
        self.generic_visit(node)
    
    def visit_Name(self, node):
        # Check for sensor variable usages
        if node.id in self.sensor_mappings.values():
            self.sensors_used.add(node.id)
            #print(f"Detected sensor: {node.id}")
        self.generic_visit(node)

def analyse_code(code: str) -> Dict[str, Any]:
    """Analyze code for activities and sensors"""
    try:
        #print(f"Analyzing code:\n{code}")
        tree = ast.parse(code)
        analyzer = CodeAnalyser(sensor_mappings, set(ACTIVITIES))
        analyzer.visit(tree)
        
        result = {
            "sensors": list(analyzer.sensors_used),
            "activities": [
                activity for activity in analyzer.activities_used 
                if activity["activity"] in ACTIVITIES
            ]
        }
        #print(f"Analysis result: {result}")
        return result
        
    except SyntaxError as e:
        print(f"Syntax error while parsing: {e}")
        return {"sensors": [], "activities": []}

# # Test the analyzer
# if __name__ == '__main__':
#     test_code = '''
# def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
#     return activity_data.get('activity') == "Eating" and activity_data.get('activity_status') == "end"
# '''
#     analyse_code(test_code)
