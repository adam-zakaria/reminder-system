import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../Authcontext";
import { chatApi } from "../../utils/api";
import {
  Container,
  TextField,
  IconButton,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
} from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";

const ChatBox = ({ onChatResponse }) => {
  const { token, username, userId } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatSessionId, setChatSessionId] = useState(null); // Session ID for chat API
  const [isLoading, setIsLoading] = useState(false);
  const [examplesVisible, setExamplesVisible] = useState(true);

  useEffect(() => {
    if (username) {
      setMessages([
        {
          text: "Let me know what kind of reminder you want to create.",
          sender: "Assistant",
        },
      ]);
    }
  }, [username]);

  const sendMessageToAPI = async (message) => {
    setIsLoading(true);

    try {
      const payload = { message, userId };
      if (chatSessionId) {
        payload.sessionId = chatSessionId;
      }

      const response = await chatApi.post("/chat/", payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 20000, // Set timeout to 20,000 milliseconds (20 seconds)
      });

      if (response.data?.sessionId && !chatSessionId) {
        setChatSessionId(response.data.sessionId);
      }

      const apiResponse = response.data?.response;
      const analysedCodeOutput = response.data?.analysed_code_output;

      if (apiResponse?.assistant) {
        const assistantMessage = { text: apiResponse.assistant, sender: "Assistant" };

        setMessages((prevMessages) => {
          const updatedMessages = prevMessages.filter(
            (msg) => msg.text !== "..."
          );
          return [...updatedMessages, assistantMessage];
        });

        if (onChatResponse) {
          onChatResponse({
            message: apiResponse.assistant,
            code: response.data?.code_output?.code,
            language: response.data?.code_output?.language,
            analysed_code_output: analysedCodeOutput, // Pass analysed code output
          });
        }
      } else {
        console.error("Unexpected API response format:", response.data);
      }
    } catch (error) {
      console.error("Error sending message to API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() !== "") {
      const userMessage = { text: newMessage, sender: username || "You" };
      setMessages((prevMessages) => [
        ...prevMessages,
        userMessage,
        { text: "...", sender: "Assistant" },
      ]);

      sendMessageToAPI(newMessage);

      setNewMessage("");
      setExamplesVisible(false);
    }
  };

  return (
    <Container maxWidth="sm" style={{ display: "flex", flexDirection: "column", height: "90vh" }}>
      <Box style={{ flexGrow: 1, overflowY: "auto" }}>
        <List>
          {messages.map((message, index) => (
            <ListItem key={index} alignItems="flex-start">
              <ListItemAvatar>
                <Avatar>
                  {message.sender === (username || "You")
                    ? username?.charAt(0) || "Y"
                    : "A"}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={`${message.sender}: ${message.text}`} />
            </ListItem>
          ))}
        </List>
      </Box>
      <Box style={{ borderTop: "1px solid #ccc", paddingTop: "8px", backgroundColor: "#fff" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />
          </Grid>
          <Grid item>
            <IconButton color="primary" onClick={sendMessage}>
              <SendIcon />
            </IconButton>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ChatBox;
