# Bots Codebase Documentation

## Overview
This codebase implements a reminder system with natural language processing capabilities using a microservices architecture. The system uses OpenAI's LLM for processing user requests and generating state machine logic.

## Core Components

### 1. Chat Assistant [`ChatAssistant`](bots/chat_assistant.py)
The main interface for processing user conversations and generating responses.

- **Key Methods**:
  - `generate_assistant_response(session_id, user_input, userId)`
  - `transform_summary_for_code_generation(summary)`
  - `format_conversation_history(conversation_history)`

### 2. Code Generator [`CodeGenerator`](bots/code_generation.py)
Handles generation of Python code based on user requirements.

- **Key Methods**:
  - `generate_code(summary_data, error_message=None)`
  - `get_code_generation_chain()`

### 3. Scheduler Service [`SchedulerService`](bots/util/scheduler.py)
Manages task scheduling and execution.

- **Key Features**:
  - Task persistence
  - Recurring tasks support
  - Multiple recurrence types (daily, weekly)

### 4. State Machine Executor [`StateMachineExecutor`](bots/state_machine_executor.py)
Handles validation and execution of generated state machines.

## Testing

### Test Structure
- [`test_scheduler.py`](bots/tests/test_scheduler.py): Tests for scheduling functionality
- [`test_reminder.py`](bots/tests/test_reminder.py): Tests for reminder creation and validation

### Running Tests
```bash
python -m pytest tests/