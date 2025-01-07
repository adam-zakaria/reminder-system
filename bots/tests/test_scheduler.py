import pytest
from datetime import datetime, timedelta
import os
from util.scheduler import SchedulerService
import json
import time

# Define test paths
TEST_DATA_DIR = os.path.join(os.path.dirname(__file__), "test_data")
TEST_SCHEDULER_FILE = os.path.join(TEST_DATA_DIR, "test_scheduler.json")

def clear_json_file(file_path):
    """Clear JSON file contents without deleting the file"""
    if os.path.exists(file_path):
        with open(file_path, 'w') as f:
            json.dump({}, f)

@pytest.fixture(autouse=True)
def setup_test_env():
    """Setup and cleanup test environment"""
    os.makedirs(TEST_DATA_DIR, exist_ok=True)
    clear_json_file(TEST_SCHEDULER_FILE)
    yield

@pytest.fixture
def scheduler():
    """Fixture to create a scheduler instance"""
    scheduler = SchedulerService(scheduler_file=TEST_SCHEDULER_FILE)
    scheduler.start()
    yield scheduler
    scheduler.stop()

def test_scheduler_initialization(scheduler):
    """Test scheduler initialization"""
    assert scheduler is not None
    assert scheduler.running is True
    assert scheduler.scheduler_thread is not None
    assert scheduler.scheduler_thread.is_alive()

def test_weekly_recurring_task(scheduler):
        """Test weekly recurring task"""
        task_id = scheduler.add_task(
            date="today",
            start_time="10:00",
            end_time="11:00", 
            recurrence_type="weekly",
            function_name="weekly_test",
            occurrence="once",
            days=["Monday", "Wednesday", "Friday"]
        )

        task = scheduler._SchedulerService__task_registry[task_id]
        assert task["recurrence"] == "weekly"
        assert task["days"] == ["Monday", "Wednesday", "Friday"]
        assert task["status"] == "scheduled"

def test_task_with_args(scheduler):
        """Test task with arguments"""
        test_args = ["arg1", "arg2"]
        task_id = scheduler.add_task(
            date="today", 
            start_time="09:00",
            end_time="10:00",
            recurrence_type="once",
            function_name="test_with_args",
            args=test_args
        )

        task = scheduler._SchedulerService__task_registry[task_id]
        assert task["args"] == test_args

def test_parse_date_formats(scheduler):
        """Test different date format parsing"""
        # Test 'today'
        task_id1 = scheduler.add_task(
            date="today",
            start_time="10:00",
            end_time="11:00",
            recurrence_type="once", 
            function_name="test1"
        )
        
        # Test 'tomorrow'
        task_id2 = scheduler.add_task(
            date="tomorrow",
            start_time="10:00",
            end_time="11:00",
            recurrence_type="once",
            function_name="test2"
        )
        
        # Test specific date
        task_id3 = scheduler.add_task(
            date="2024-12-31",
            start_time="10:00",
            end_time="11:00", 
            recurrence_type="once",
            function_name="test3"
        )

        task1 = scheduler._SchedulerService__task_registry[task_id1]
        task2 = scheduler._SchedulerService__task_registry[task_id2]
        task3 = scheduler._SchedulerService__task_registry[task_id3]

        assert task1["date"] == "today"
        assert task2["date"] == "tomorrow"
        assert task3["date"] == "2024-12-31"

def test_daily_recurring_task(scheduler):
    """Test daily recurring task"""
    task_id = scheduler.add_task(
        date="today",
        start_time="14:00",
        end_time="15:00",
        recurrence_type="daily",
        function_name="daily_test",
        occurrence="once"
    )
    
    task = scheduler._SchedulerService__task_registry[task_id]
    assert task["recurrence"] == "daily"
    assert task["occurrence"] == "once"

def test_execution_tracking(scheduler):
    """Test task execution tracking"""
    task_id = scheduler.add_task(
        date="today",
        start_time="16:00",
        end_time="17:00",
        recurrence_type="once",
        function_name="track_test"
    )
    
    # Simulate task execution
    scheduler.track_task_execution(task_id, "running")
    status = scheduler.get_task_status(task_id)
    
    assert status["current"]["status"] == "running"
    assert len(status["history"]) == 1

def test_cleanup_completed_tasks(scheduler):
    """Test cleanup of completed one-time tasks"""
    task_id = scheduler.add_task(
        date="today",
        start_time="18:00",
        end_time="19:00",
        recurrence_type="once",
        function_name="cleanup_test"
    )
    
    # Mark task as completed
    scheduler._SchedulerService__task_registry[task_id]["status"] = "completed"
    scheduler.cleanup_completed_tasks()
    
    assert task_id not in scheduler._SchedulerService__task_registry

def test_task_persistence(scheduler):
    """Test task persistence to JSON"""
    # Clear JSON instead of removing file
    clear_json_file(TEST_SCHEDULER_FILE)
    scheduler._SchedulerService__task_registry.clear()

    # Add test task
    task_id = scheduler.add_task(
        date="today",
        start_time="12:00",
        end_time="13:00",
        recurrence_type="once",
        function_name="persist_test"
    )

    # Memory verification
    assert task_id in scheduler._SchedulerService__task_registry
    memory_task = scheduler._SchedulerService__task_registry[task_id]
    assert memory_task["date"] == "today"
    assert memory_task["function_name"] == "persist_test"

    # Force persistence
    scheduler._SchedulerService__save_tasks()
    time.sleep(0.5)

    # File verification
    assert os.path.exists(TEST_SCHEDULER_FILE)