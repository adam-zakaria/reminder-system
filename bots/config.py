# config.py

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv('../.env')

# OpenAI API configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Other configuration variables can be added here