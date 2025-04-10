"""
Path setup utilities for the reminder system MVP

This module handles:
1. Setting up correct paths to repository components
2. Creating necessary datastore files
3. Monkeypatching Python's open() to handle relative paths correctly
"""

import os
import sys
import builtins

def setup_paths():
    """Setup all necessary paths and return important directories"""
    # Resolve project paths
    current_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(current_dir, '../..'))
    bots_dir = os.path.join(repo_root, 'bots')
    tests_dir = os.path.join(bots_dir, 'tests')
    datastore_dir = os.path.join(repo_root, 'Datastore')
    
    print(f"Repository Root: {repo_root}")
    print(f"Datastore Dir: {datastore_dir}")
    
    # Ensure Datastore directory exists
    os.makedirs(datastore_dir, exist_ok=True)
    
    # Add necessary paths to sys.path
    sys.path.insert(0, repo_root)
    sys.path.insert(0, bots_dir)
    sys.path.insert(0, tests_dir)
    
    return {
        'current_dir': current_dir,
        'repo_root': repo_root,
        'bots_dir': bots_dir, 
        'tests_dir': tests_dir,
        'datastore_dir': datastore_dir
    }

def setup_datastore_files(datastore_dir):
    """Create necessary files that ChatAssistant expects"""
    for filename in ['state_machines.json', 'sensor_mapping.json', 'activities.json']:
        filepath = os.path.join(datastore_dir, filename)
        if not os.path.exists(filepath):
            with builtins.open(filepath, 'w') as f:
                if filename == 'activities.json':
                    f.write('{"activities": {"Meal_Preparation": true, "Sleeping": true, "Eating": true}}')
                else:
                    f.write('{}')
            print(f"Created empty {filename} file")

def setup_path_monkeypatch(datastore_dir):
    """Setup monkeypatching for file paths"""
    # Store the original open function
    original_open = builtins.open
    
    # Create a monkeypatch for open() to fix path issues
    def patched_open(file, *args, **kwargs):
        filepath = str(file)
        
        # Handle all variants of Datastore paths
        if '../Datastore/' in filepath or '../Datastore\\' in filepath:
            # Extract the filename from the path
            filename = os.path.basename(filepath)
            fixed_path = os.path.join(datastore_dir, filename)
            print(f"Redirecting '{filepath}' to '{fixed_path}'")
            return original_open(fixed_path, *args, **kwargs)
        
        return original_open(filepath, *args, **kwargs)
    
    # Apply the monkeypatch to builtins.open
    builtins.open = patched_open

def display_banner(paths):
    """Display a banner showing the application is running"""
    print("\n" + "=" * 50)
    print("Reminder System MVP".center(50))
    print("=" * 50)
    print(f"Repository Root: {paths['repo_root']}")
    print(f"Running from: {paths['current_dir']}")
    print("-" * 50 + "\n")

def initialize_environment():
    """
    Initialize the complete environment for the application.
    
    Returns:
        dict: Dictionary containing path information
    """
    # Setup paths and environment
    paths = setup_paths()
    setup_datastore_files(paths['datastore_dir'])
    setup_path_monkeypatch(paths['datastore_dir'])
    display_banner(paths)
    
    return paths 