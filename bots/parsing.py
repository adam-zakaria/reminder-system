def parse_chatbot_output_to_summarization(chatbot_output):
    """
    Converts chatbot output with content into summarization input format.
    
    Args:
    chatbot_output (list): The original chatbot output with "role" and "content" fields.
    
    Returns:
    list: A list of messages formatted for summarization with "role" and "message" fields.
    """
    # Initialize an empty list for the desired input structure
    summarization_input = []

    # Loop through each message in the chatbot output
    for message in chatbot_output:
        # Extract the role (user or assistant)
        role = message.get("role")
        
        # Extract the message text from the content array
        content = message.get("content", [])
        if content and content[0].get("type") == "text":
            text = content[0].get("text")
        else:
            text = ""

        # Append the parsed message to the summarization input list
        summarization_input.append({
            "role": role,
            "message": text
        })

    return summarization_input
