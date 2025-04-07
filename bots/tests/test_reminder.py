import pytest
from datetime import datetime, timedelta
import sys
import os
from unittest.mock import patch
from freezegun import freeze_time
from util.scheduler import SchedulerService

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from chat_assistant import ChatAssistant
from code_generation import CodeGenerator
from state_machine_executor import StateMachineExecutor

# Fixtures
@pytest.fixture
def sample_conversation():
    return [
        {"role": "user", "content": "I need a reminder to take medicine 2 hours after breakfast"},
        {"role": "assistant", "content": "I'll help you set up a reminder. [ChatEnded]"}
    ]

@pytest.fixture
def state_machine_executor():
    return StateMachineExecutor()

@pytest.fixture
def code_generator():
    return CodeGenerator()

@pytest.fixture
def chat_assistant():
    return ChatAssistant()

@pytest.fixture
def sample_activity_data():
    return {
        "breakfast": {
            "activity": "Eating",
            "activity_status": "end",
            "meal_type": "breakfast",
            "timestamp": datetime.now() - timedelta(hours=1)
        },
        "no_activity": {},
        "invalid_activity": {
            "activity": "Walking",
            "activity_status": "ongoing"
        }
    }

@pytest.fixture
def sample_sensor_data():
    return {
        "kitchen_occupancy": True,
        "medicine_cabinet": {"last_opened": datetime.now()},
        "room_temperature": 22.5
    }

@pytest.fixture
def sample_reminder_codes():
    """Fixture providing sample reminder codes"""
    return {
        "wash_hands_cooking": """
def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == "Meal_Preparation" and activity_data.get('activity_status') == "end"
""",
        "tv_watching": """
def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    if activity_data.get('activity') == "Relax":
        status = activity_data.get('activity_status')
        power = sensor_data.get('living_room_smart_cable', {}).get('power', False)
        
        if status == "start" and power:
            blackboard['relax_start_time'] = datetime.now()
            blackboard.setdefault('total_relax_time', timedelta())
        elif status == "end" and 'relax_start_time' in blackboard:
            start = blackboard.pop('relax_start_time')
            blackboard['total_relax_time'] += datetime.now() - start
        elif power and 'relax_start_time' in blackboard:
            start = blackboard['relax_start_time']
            total_time = blackboard['total_relax_time'] + (datetime.now() - start)
            if total_time > timedelta(hours=3):
                return True
    return False
""",
        "microwave_reminder": """
def reminder(time=None, activity_data=None, sensor_data=None, blackboard=None):
    microwave_on = sensor_data.get('microwave_smart_cable', {}).get('power', False)
    door_open = sensor_data.get('microwave_door_entry_sensor', {}).get('status', False)
    current_time = datetime.strptime(time, '%Y-%m-%d %H:%M:%S')

    if microwave_on:
        blackboard['microwave_was_on'] = True
        blackboard.pop('microwave_off_time', None)
    elif blackboard.get('microwave_was_on'):
        if door_open:
            blackboard.pop('microwave_was_on', None)
            blackboard.pop('microwave_off_time', None)
        else:
            if 'microwave_off_time' not in blackboard:
                blackboard['microwave_off_time'] = current_time
            elif current_time - blackboard['microwave_off_time'] >= timedelta(minutes=1):
                blackboard.pop('microwave_was_on', None)
                blackboard.pop('microwave_off_time', None)
                return True
    return False
"""
    }

@pytest.fixture
def mock_current_time():
    """Fixture to provide consistent test time"""
    return datetime(2024, 1, 1, 9, 30)  # 9:30 AM

@pytest.fixture
def mock_time_window():
    """Fixture providing time window for testing"""
    return {
        "start_time": "09:00",
        "end_time": "10:00"
    }

@pytest.fixture
def setup_scheduler():
    """Setup scheduler for testing"""
    scheduler = SchedulerService()
    scheduler.start()
    return scheduler

# Test conversation handling
def test_conversation_to_summary(chat_assistant, sample_conversation):
    """Test conversation formatting and summarization"""
    formatted_conversation = chat_assistant.format_conversation_history(sample_conversation)
    assert "[ChatEnded]" in formatted_conversation
    assert "take medicine" in formatted_conversation.lower()

# Test code generation
def test_code_generation(code_generator, state_machine_executor):
    """Test code generation from summary"""
    summary = {"task": "Take medicine 2 hours after breakfast"}
    code = code_generator.generate_code(summary)
    
    # Clean and validate code
    cleaned_code = state_machine_executor.clean_generated_code(code)
    new_name = state_machine_executor.generate_valid_function_name()
    renamed_code = state_machine_executor.rename_function_in_code(cleaned_code, new_name)
    
    assert state_machine_executor.validate_code(renamed_code)
    assert "def" in renamed_code
    assert new_name in renamed_code

# Test state machine execution
def test_state_machine_execution(state_machine_executor):
    """Test state machine with activity data"""
    code = """
def test_reminder(current_time, activity_data=None, sensor_data=None, blackboard=None):
    if not activity_data:
        return False
    return activity_data.get('activity') == 'Eating' and activity_data.get('activity_status') == 'end'
"""
    activity_data = {"activity": "Eating", "activity_status": "end"}
    
    # Execute code
    namespace = {}
    exec(code, namespace)
    result = namespace["test_reminder"](
        current_time=datetime.now(),
        activity_data=activity_data
    )
    assert result is True

def test_reminder_with_different_activities(state_machine_executor, sample_activity_data):
    """Test reminder behavior with different activity patterns"""
    code = """
def test_reminder(current_time, activity_data=None, sensor_data=None, blackboard=None):
    if not activity_data:
        return False
    if activity_data.get('activity') == 'Eating' and activity_data.get('meal_type') == 'breakfast':
        return activity_data.get('activity_status') == 'end'
    return False
"""
    namespace = {}
    exec(code, namespace)
    
    # Test with breakfast activity
    result = namespace["test_reminder"](
        current_time=datetime.now(),
        activity_data=sample_activity_data["breakfast"]
    )
    assert result is True

    # Test with no activity
    result = namespace["test_reminder"](
        current_time=datetime.now(),
        activity_data=sample_activity_data["no_activity"]
    )
    assert result is False

    # Test with invalid activity
    result = namespace["test_reminder"](
        current_time=datetime.now(),
        activity_data=sample_activity_data["invalid_activity"]
    )
    assert result is False

def test_reminder_timing_conditions(state_machine_executor):
    """Test reminder timing logic"""
    current_time = datetime.now()
    breakfast_time = current_time - timedelta(hours=2)
    
    activity_data = {
        "activity": "Eating",
        "activity_status": "end",
        "meal_type": "breakfast",
        "timestamp": breakfast_time
    }
    
    code = """
def test_reminder(current_time, activity_data=None, sensor_data=None, blackboard=None):
    if not activity_data or 'timestamp' not in activity_data:
        return False
    from datetime import timedelta
    time_diff = current_time - activity_data['timestamp']
    return (time_diff >= timedelta(hours=2) and 
            activity_data.get('activity') == 'Eating' and 
            activity_data.get('meal_type') == 'breakfast')
"""
    namespace = {}
    exec(code, {'datetime': datetime}, namespace)
    result = namespace["test_reminder"](
        current_time=current_time,
        activity_data=activity_data
    )
    assert result is True

def test_pipeline_with_sensor_data(chat_assistant, code_generator, state_machine_executor, 
                                 sample_conversation, sample_sensor_data):
    """Test pipeline with sensor data integration"""
    formatted_conv = chat_assistant.format_conversation_history(sample_conversation)
    summary = {
        "task": "Take medicine 2 hours after breakfast",
        "time": {"time_inferred": "after breakfast"},
        "recurrence": {"type": "once", "details": {"occurrence_frequency": "once"}}
    }
    code = code_generator.generate_code(summary)
    
    cleaned_code = state_machine_executor.clean_generated_code(code)
    new_name = state_machine_executor.generate_valid_function_name()
    renamed_code = state_machine_executor.rename_function_in_code(cleaned_code, new_name)
    
    activity_data = {
        "activity": "Eating",
        "activity_status": "end",
        "meal_type": "breakfast",
        "timestamp": datetime.now() - timedelta(hours=2)
    }
    
    namespace = {}
    exec(renamed_code, {'datetime': datetime, 'timedelta': timedelta}, namespace)
    result = namespace[new_name](
        current_time=datetime.now(),
        activity_data=activity_data
    )
    assert result is True

# Test end-to-end pipeline
def test_pipeline_end_to_end(chat_assistant, code_generator, state_machine_executor, sample_conversation):
    """Test complete pipeline flow"""
    # 1. Process conversation
    formatted_conv = chat_assistant.format_conversation_history(sample_conversation)
    
    # 2. Generate code
    summary = {
        "task": "Take medicine 2 hours after breakfast",
        "time": {"time_inferred": "after breakfast"},
        "recurrence": {"type": "once", "details": {"occurrence_frequency": "once"}}
    }
    code = code_generator.generate_code(summary)
    print('--------------------------------')
    print('code')
    print(code)
    print('--------------------------------')
    
    # 3. Clean and validate
    cleaned_code = state_machine_executor.clean_generated_code(code)
    new_name = state_machine_executor.generate_valid_function_name()
    renamed_code = state_machine_executor.rename_function_in_code(cleaned_code, new_name)
    assert state_machine_executor.validate_code(renamed_code)
    print('--------------------------------')
    print('renamed_code')
    print(renamed_code)
    print('--------------------------------')
    
    # 4. Execute
    # This code generation pattern is just creating that function definition as a string, then using exec to turn it into a callable function.
    namespace = {}
    exec(renamed_code, {'datetime': datetime, 'timedelta': timedelta}, namespace) # defines a function in the namespace, including imports
    result = namespace[new_name](
        time=datetime.now().isoformat(),
        activity_data={"activity": "Eating", "status": "end"},
        sensor_data=None,
        blackboard={'breakfast_end_time': (datetime.now() - timedelta(hours=2, minutes=5)).isoformat()}
    )  # calls the function in the namespace
    print('--------------------------------')
    print('result')
    print(result)
    print('--------------------------------')
    assert result is True

def test_wash_hands_after_cooking(state_machine_executor, sample_reminder_codes):
    """Test reminder for washing hands after cooking"""
    code = sample_reminder_codes["wash_hands_cooking"]
    namespace = {}
    exec(code, {'datetime': datetime, 'timedelta': timedelta}, namespace)
    
    # Test with cooking activity ended
    result = namespace["reminder"](
        time=datetime.now().isoformat(),
        activity_data={"activity": "Meal_Preparation", "activity_status": "end"}
    )
    assert result is True

    # Test with cooking activity started
    result = namespace["reminder"](
        time=datetime.now().isoformat(),
        activity_data={"activity": "Meal_Preparation", "activity_status": "start"}
    )
    assert result is False

def test_tv_watching_reminder(state_machine_executor, sample_reminder_codes):
    """Test TV watching duration reminder"""
    code = sample_reminder_codes["tv_watching"]
    namespace = {}
    exec(code, {'datetime': datetime, 'timedelta': timedelta}, namespace)
    
    # Initialize blackboard
    blackboard = {}
    
    # Test start watching TV
    result = namespace["reminder"](
        time=datetime.now().isoformat(),
        activity_data={"activity": "Relax", "activity_status": "start"},
        sensor_data={"living_room_smart_cable": {"power": True}},
        blackboard=blackboard
    )
    assert result is False
    assert 'relax_start_time' in blackboard

    # Simulate 3.5 hours of TV watching
    blackboard['relax_start_time'] = datetime.now() - timedelta(hours=3.5)
    blackboard['total_relax_time'] = timedelta(hours=3.5)
    
    # Test exceeding time limit
    result = namespace["reminder"](
        time=datetime.now().isoformat(),
        activity_data={"activity": "Relax", "activity_status": "start"},
        sensor_data={"living_room_smart_cable": {"power": True}},
        blackboard=blackboard
    )
    assert result is True

def test_microwave_reminder(state_machine_executor, sample_reminder_codes):
    """Test microwave food reminder"""
    code = sample_reminder_codes["microwave_reminder"]
    namespace = {}
    exec(code, {'datetime': datetime, 'timedelta': timedelta}, namespace)
    
    current_time = datetime.now()
    blackboard = {}
    
    # Test microwave turned on
    result = namespace["reminder"](
        time=current_time.strftime('%Y-%m-%d %H:%M:%S'),
        sensor_data={
            "microwave_smart_cable": {"power": True},
            "microwave_door_entry_sensor": {"status": False}
        },
        blackboard=blackboard
    )
    assert result is False
    assert blackboard.get('microwave_was_on') is True

    # Test after 1 minute with door closed
    current_time += timedelta(minutes=1)
    result = namespace["reminder"](
        time=current_time.strftime('%Y-%m-%d %H:%M:%S'),
        sensor_data={
            "microwave_smart_cable": {"power": False},
            "microwave_door_entry_sensor": {"status": False}
        },
        blackboard=blackboard
    )
    assert result is True

def test_scheduler_integration(state_machine_executor):
    """Test scheduler integration with reminders"""
    from util.scheduler import SchedulerService
    scheduler = SchedulerService()
    
    # Test scheduling a one-time reminder
    test_reminder = """
def test_reminder(current_time, activity_data=None, sensor_data=None, blackboard=None):
    return activity_data.get('activity') == "Eating" and activity_data.get('activity_status') == "end"
"""
    # Schedule for 5 seconds from now
    current_time = datetime.now()
    scheduler.add_task(
        date='today',
        start_time=(current_time + timedelta(seconds=5)).strftime('%H:%M'),
        end_time=None,
        recurrence_type='once',
        function_name='test_reminder',
        occurrence='once'
    )
    
    # Verify the task was scheduled
    assert len(scheduler._SchedulerService__task_registry) > 0

def test_reminder_execution(state_machine_executor):
    """Test reminder execution through StateMachineExecutor"""
    # Test data
    current_time = datetime.now()
    activity_data = {
        "activity": "Eating",
        "activity_status": "end",
        "meal_type": "breakfast",
        "timestamp": current_time - timedelta(hours=2)
    }
    sensor_data = {
        "kitchen_occupancy": True,
        "medicine_cabinet": {"last_opened": current_time},
        "stove_temp_humidity_sensor": {"temp": 60}
    }
    blackboard = {}

    # Sample state machine
    state_machine = {
        "stateMachineId": "test_123",
        "generated_code": """
def reminder(current_time, activity_data=None, sensor_data=None, blackboard=None):
    if not activity_data:
        return False
    if activity_data.get('activity') == 'Eating' and activity_data.get('meal_type') == 'breakfast':
        return activity_data.get('activity_status') == 'end'
    return False
"""
    }

    # Execute using state machine executor
    result = state_machine_executor.execute_generated_code(
        state_machine=state_machine,
        current_time=current_time,
        activity_data=activity_data,
        sensor_data=sensor_data,
        blackboard=blackboard
    )
    assert result is True

def test_state_machine_pipeline(state_machine_executor, chat_assistant, code_generator):
    """Test complete state machine pipeline using executor"""
    # Sample data
    session_id = "test_session"
    user_id = "test_user"
    conversation_summary = {
        "content": {
            "task": "Take medicine after breakfast",
            "time": {"time_inferred": "after breakfast"},
            "recurrence": {"type": "once", "details": {"occurrence_frequency": "once"}}
        }
    }
    
    # Generate and validate code
    code = code_generator.generate_code(conversation_summary["content"])
    cleaned_code = state_machine_executor.clean_generated_code(code)
    new_name = state_machine_executor.generate_valid_function_name()
    renamed_code = state_machine_executor.rename_function_in_code(cleaned_code, new_name)
    
    # Save state machine
    state_machine_executor.save_state_machine_to_json(
        session_id=session_id,
        user_id=user_id,
        conversation_summary=conversation_summary,
        generated_code=renamed_code,
        analysed_data={
            "sensors": ["medicine_cabinet"],
            "activities": [{"activity": "Eating", "status": "end"}]
        }
    )

    # Execute all state machines
    current_time = datetime.now()
    activity_data = {
        "activity": "Eating",
        "activity_status": "end",
        "meal_type": "breakfast"
    }
    sensor_data = {
        "medicine_cabinet": {"last_opened": current_time}
    }

    results = state_machine_executor.execute_all_state_machines(
        time=current_time,
        activity_data=activity_data,
        sensor_data=sensor_data
    )
    
    assert len(results) > 0
    assert any(result["executionResult"] is True for result in results)

def test_state_machine_pipeline_with_time(
    state_machine_executor, 
    chat_assistant, 
    code_generator,
    mock_current_time,
    mock_time_window
):
    """Test pipeline with frozen time"""
    session_id = "test_session"
    user_id = "test_user"
    
    # Freeze time to 9:30 AM
    with freeze_time(mock_current_time):
        conversation_summary = {
            "content": {
                "task": "Take medicine after breakfast",
                "time": {
                    "exact_time": mock_time_window,
                    "time_inferred": "after breakfast"
                },
                "recurrence": {"type": "once", "details": {"occurrence_frequency": "once"}}
            }
        }
        
        # Generate and save state machine
        code = code_generator.generate_code(conversation_summary["content"])
        cleaned_code = state_machine_executor.clean_generated_code(code)
        new_name = state_machine_executor.generate_valid_function_name()
        renamed_code = state_machine_executor.rename_function_in_code(cleaned_code, new_name)
        
        state_machine_executor.save_state_machine_to_json(
            session_id=session_id,
            user_id=user_id,
            conversation_summary=conversation_summary,
            generated_code=renamed_code,
            analysed_data={
                "sensors": ["medicine_cabinet"],
                "activities": [{"activity": "Eating", "status": "end"}]
            }
        )

        # Test execution within time window
        activity_data = {
            "activity": "Eating",
            "activity_status": "end",
            "meal_type": "breakfast"
        }
        sensor_data = {
            "medicine_cabinet": {"last_opened": mock_current_time}
        }

        results = state_machine_executor.execute_all_state_machines(
            time=mock_current_time,
            activity_data=activity_data,
            sensor_data=sensor_data
        )
        
        assert len(results) > 0
        assert any(result["executionResult"] is True for result in results)

        # Test execution outside time window
        with freeze_time(mock_current_time + timedelta(hours=2)):
            results = state_machine_executor.execute_all_state_machines(
                time=mock_current_time + timedelta(hours=2),
                activity_data=activity_data,
                sensor_data=sensor_data
            )
            assert not any(result["executionResult"] is True for result in results)

def test_state_machine_activation_deactivation(state_machine_executor, setup_scheduler):
    """Test state machine activation/deactivation based on time window"""
    
    with freeze_time("2024-01-01 08:50:00"):  # Before window
        # 1. Create and save state machine
        summary = {
            "content": {
                "task": "Take medicine after breakfast",
                "time": {
                    "exact_time": {
                        "start_time": "09:00",
                        "end_time": "10:00"
                    },
                    "time_inferred": "morning"
                },
                "date": "today",
                "recurrence": {
                    "type": "once",
                    "details": {"occurrence_frequency": "once"}
                }
            }
        }
        
        state_machine_executor.save_state_machine_to_json(
            session_id="test_session",
            user_id="test_user",
            conversation_summary=summary,
            generated_code="def reminder(): return True",
            analysed_data={
                "sensors": ["medicine_cabinet"],
                "activities": [{"activity": "Eating", "status": "end"}]
            }
        )
        
        # Get state machine ID
        state_machines = state_machine_executor.load_state_machines()
        state_machine_id = state_machines["test_session"]["state_machines"][-1]["stateMachineId"]
        
        # 2. Test initial state (should be active by default)
        initial_state_machines = state_machine_executor.load_state_machines()
        initial_machine = initial_state_machines["test_session"]["state_machines"][-1]
        assert initial_machine.get("active", True) is True
        
        # 3. Test deactivation
        state_machine_executor.deactivate_state_machine(state_machine_id)
        state_machines = state_machine_executor.load_state_machines()
        machine = state_machines["test_session"]["state_machines"][-1]
        assert machine.get("active") is False
        
        # 4. Test activation
        state_machine_executor.activate_state_machine(state_machine_id)
        state_machines = state_machine_executor.load_state_machines()
        machine = state_machines["test_session"]["state_machines"][-1]
        assert machine.get("active") is True
        
        # 5. Test execution based on active state
        activity_data = {
            "activity": "Eating",
            "activity_status": "end"
        }
        
        # Should execute when active
        results = state_machine_executor.execute_all_state_machines(
            time=datetime.now(),
            activity_data=activity_data
        )
        assert any(r["stateMachineId"] == state_machine_id for r in results)
        
        # Should not execute when inactive
        state_machine_executor.deactivate_state_machine(state_machine_id)
        results = state_machine_executor.execute_all_state_machines(
            time=datetime.now(),
            activity_data=activity_data
        )
        assert not any(r["stateMachineId"] == state_machine_id for r in results)