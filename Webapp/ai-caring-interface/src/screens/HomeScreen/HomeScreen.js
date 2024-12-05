import React, { useState, useEffect, useContext } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import ReminderForm from '../../components/ReminderForm/ReminderForm';
import ChatBox from '../../components/ChatBox/ChatBox';
import { api } from '../../utils/api';
import { AuthContext } from '../../Authcontext';
import { jwtDecode } from 'jwt-decode';
import CodeViewer from '../../components/CodeViewer/CodeViewer'
import Flowchart from '../../components/Flowchart/Flowchart'; // Import Flowchart component
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType, // This is necessary for arrow markers
} from "reactflow";

function HomeScreen() {
  const [reminder, setReminder] = useState({
    userId: '',
    message: '',
    interval: '',
    time: '',
    utility_name: '',
    component_name: '',
    condition: '',
    display: '',
    delay: null,
    disappearOnCondition: 'false',
    activity: null,
    triggerTime: null,
    triggerType: null,
    lightCategoryId: null
  });

  const [flowchartData, setFlowchartData] = useState({ nodes: [], edges: [] });
  const [loadingReminder, setLoadingReminder] = useState(false);
  const [invalidFields, setInvalidFields] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [hasResponse, setHasResponse] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState(null);
  const [assistantMessage, setAssistantMessage] = useState('');
  const navigate = useNavigate();
  const { token, role } = useContext(AuthContext);

  const isAdmin = role === 'superuser';
  console.log(isAdmin, "isAdmin")

  useEffect(() => {
    if (token) {
      const decodedToken = jwtDecode(token);
      const userId = decodedToken.userId;
      const userRole = decodedToken.role;
      //setReminder((prevReminder) => ({ ...prevReminder, userId }));
    }
  }, [token]);

  const createDynamicFlowchart = (analysedCodeOutput) => {
    const nodes = [];
    const edges = [];

    if (analysedCodeOutput) {
      const { sensors = {}, activities = [] } = analysedCodeOutput; // Default to empty objects/arrays

      // Start Node
      nodes.push({
        id: "1",
        type: "start",
        data: { label: "Start" },
        position: { x: 250, y: 0 },
      });

      let nextNodeId = 2;

      // Sensor Nodes
      Object.keys(sensors).forEach((sensorKey) => {
        nodes.push({
          id: `${nextNodeId}`,
          type: "sensor",
          data: { label: `${sensorKey} (${sensors[sensorKey] ? "Active" : "Inactive"})` },
          position: { x: 150 * nextNodeId, y: 100 },
        });
        edges.push({
          id: `e1-${nextNodeId}`,
          source: "1",
          target: `${nextNodeId}`,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed },
        });
        nextNodeId++;
      });

      // Activity Nodes
      activities.forEach((activity, index) => {
        nodes.push({
          id: `${nextNodeId}`,
          type: "activity",
          data: { label: `${activity.activity_type} (${activity.status})` },
          position: { x: 150 * (index + 1), y: 200 },
        });
        edges.push({
          id: `e${nextNodeId - 1}-${nextNodeId}`,
          source: `${nextNodeId - 1}`,
          target: `${nextNodeId}`,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed },
        });
        nextNodeId++;
      });

      // End Node
      nodes.push({
        id: `${nextNodeId}`,
        type: "end",
        data: { label: "End" },
        position: { x: 250, y: 300 },
      });
      edges.push({
        id: `e${nextNodeId - 1}-${nextNodeId}`,
        source: `${nextNodeId - 1}`,
        target: `${nextNodeId}`,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
      });
    } else {
      // Fallback flowchart
      nodes.push({
        id: "1",
        type: "start",
        data: { label: "No Data Available" },
        position: { x: 250, y: 0 },
      });
    }

    return { nodes, edges };
  };

  const handleChange = (name, value) => {
    //setReminder({ ...reminder, [name]: value });
  };

  const formInvalid = () => {
    const invalid = [];
    const { userId, message, interval, display, time, utility_name, component_name, condition, delay, activity, triggerTime, triggerType, lightCategoryId } = reminder;

    // Validate required fields for all reminder types
    if (!userId) invalid.push('userId');
    if (!message) invalid.push('message');
    if (!interval) invalid.push('interval');
    if (!display) invalid.push('display');
    if (!lightCategoryId) invalid.push('lightCategoryId');


    // Non-dependent reminder
    if (time) {
      if (utility_name || component_name || condition || delay || activity || triggerTime || triggerType) {
        invalid.push('utility_name', 'component_name', 'condition', 'delay', 'activity', 'triggerTime', 'triggerType');
      }
    }
    // Dependent reminder
    else if (utility_name && component_name && condition) {
      if (time || activity || triggerTime || triggerType) {
        invalid.push('time', 'activity', 'triggerTime', 'triggerType');
      }
    }
    // Activity-based reminder
    else if (activity && triggerTime && triggerType) {
      if (time || utility_name || component_name || condition || delay) {
        invalid.push('time', 'utility_name', 'component_name', 'condition', 'delay');
      }
    }
    // Generic reminder (none of the specific types)
    else {
      // Add validation for any other required fields here
    }

    setInvalidFields(invalid);
    return invalid.length > 0;
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    const isInvalid = formInvalid();
    if (isInvalid) {
      const invalidFieldNames = invalidFields.join(', ');
      toast.error(`Please fill in the following fields correctly: ${invalidFieldNames}`);
      return;
    }

    setLoadingReminder(true);
    try {
      console.log(reminder, "reminder inside submit");
      const response = await api.post('/reminders', reminder, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response.data);
      toast.success('Reminder Created Successfully!');
      navigate('/reminders');
    } catch (error) {
      console.error(error);
      toast.error(`An error occurred: ${error.message}`);
    }
    setLoadingReminder(false);
  };

  // const handleChatResponse = (response) => {
  //   if (response && Object.keys(response).length > 0) {
  //     console.log("insdie handle chat response", response)
  //     setReminder((prevReminder) => ({
  //       ...prevReminder,
  //       message: response.assistant.message || prevReminder.message,
  //       display: response.response.display || prevReminder.display,
  //       interval: response.response.interval?.toLowerCase() || prevReminder.interval,
  //       time: response.response.time || prevReminder.time,
  //       utility_name: response.response.utility_name || prevReminder.utility_name,
  //       component_name: response.response.component_name || prevReminder.component_name,
  //       condition: response.response.condition || prevReminder.condition,
  //       delay: response.response.delay || prevReminder.delay,
  //       activity: response.response.activity || prevReminder.activity,
  //       triggerTime: response.response.triggerTime || prevReminder.triggerTime,
  //       triggerType: response.response.triggerType || prevReminder.triggerType,
  //       lightCategoryId: response.response.lightCategoryId || prevReminder.lightCategoryId
  //     }));
  //     setHasResponse(response.hasResponse);
  //   }
  // };

  const handleChatResponse = (response) => {
    // Update assistant message
    if (response?.message) {
      setAssistantMessage(response.message);
    }

    if (response?.analysed_code_output) {
      const dynamicFlowchart = createDynamicFlowchart(response.analysed_code_output);
      setFlowchartData(dynamicFlowchart);
    }

    // Update code snippet if available
    if (response?.code) {
      // Decode the code string properly
      let decodedCode = response.code;
      try {
        decodedCode = JSON.parse(`"${decodedCode}"`); // Parse and decode the string
      } catch (error) {
        console.error('Error parsing code:', error);
      }

      setCodeSnippet({
        code: decodedCode,
        language: response.language,
      });
    } else {
      setCodeSnippet(null); // Clear code snippet if none is available
    }
  };

  useEffect(() => {
    formInvalid(); // Update invalid fields on state change
  }, [reminder]);

  return (
    <View style={styles.container}>
      <View style={[styles.leftContainer, isAdmin && codeSnippet && styles.expandedLeftContainer]}>
        {hasResponse && (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <ReminderForm
              reminder={reminder}
              handleChange={handleChange}
              handleSubmit={handleSubmit}
              loadingReminder={loadingReminder}
              invalidFields={invalidFields}
              isEditing={false}
              submitted={submitted}
            />
            {loadingReminder && <ActivityIndicator size="large" color="#0000ff" />}
          </ScrollView>
        )}

        {/* Render Flowchart Above the Code Snippet */}
        {/* Render Flowchart */}
        {isAdmin && flowchartData.nodes.length > 0 && (
          <View style={styles.flowchartContainer}>
            <Flowchart nodes={flowchartData.nodes} edges={flowchartData.edges} />
          </View>
        )}
        {/* Code Snippet in the Left Container */}
        {/* Only show CodeViewer if the user is an admin */}
        {isAdmin && codeSnippet && (
          <View style={styles.codeSnippetContainer}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
              <CodeViewer code={codeSnippet.code} language={codeSnippet.language} />
            </ScrollView>
          </View>
        )}

      </View>
      <View style={[styles.rightContainer, isAdmin && styles.expandedRightContainer]}>
        <ChatBox onChatResponse={handleChatResponse} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  leftContainer: {
    flex: 0, // Hidden when no response
    padding: 16,
    height: '100vh',
    display: 'none' // Ensure it does not take space when collapsed
  },
  expandedLeftContainer: {
    flex: 1, // Expand to 50% when there is a response
    display: 'flex', // Make it visible when expanded
    justifyContent: "space-between"
  },
  rightContainer: {
    flex: 1, // Full screen when no response
    padding: 16,
    height: '100vh',
  },
  expandedLeftContainer: {
    flex: 1, // Expand to 50% when there is a response
    display: 'flex', // Make it visible when expanded
    flexDirection: 'column', // Arrange items vertically
    justifyContent: 'flex-start', // Align items to the bottom
    alignItems: 'center', // Center items horizontally
  },
  expandedRightContainer: {
    flex: 1, // 50% when there is a response
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  scrollContainer: {
    flexGrow: 1,
  },
  reminderButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 10,
    marginHorizontal: 20,
  },
  reminderButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  codeSnippetContainer: {
    width: "100%",
    maxHeight: "50%",
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    overflow: 'hidden',
    border: '1px solid #ddd',
    marginBottom: 100
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  flowchartContainer: {
    width: "100%",
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    overflow: 'auto', // Ensure scrolling if needed
    border: '1px solid #ddd',
    minHeight: 200, // Ensure minimum visibility
    marginBottom: 16,
  },

});

export default HomeScreen;
