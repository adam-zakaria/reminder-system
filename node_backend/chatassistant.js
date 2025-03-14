const OpenAI = require('openai');
const openai = new OpenAI(process.env.OPENAI_API_KEY);

(async () => {
    try {
      const assistant = await openai.assistants.create({
        name: "Reminder Creator",
        instructions: `You are a text to json extractor. 
        Ensure the structure includes the necessary fields to represent the information provided. 
        Edge cases/Instructions:
        time field can be null if the user has not provided only if there is utility and component present.
        time should be given as timestamp for example in this format : YYYY-MM-DDTHH:MM:SS.SSSZ
        delay field specifies the seconds, it can be null : example : 3000
        Prompt the user asking for the specific missing information in a user friendly way
        Utility, component, delay and condition field can be null if the user has provided time
        Prompt the user with a userfriendly message saying you cannot do it, or you didn't understand when asked for anything other than a reminder
        Add relevant time as in if it tomorrow input it for tomorrow's date with reference to the current date
        
        
        sample example :
        UserInput : everytime if Microwave door is open for more than 3 seconds show close the Microwave Door
        System response : {
            "userId": 12345,
            "message": "EVERYTIME IF Microwave door is open for more than 3 seconds SHOW Close the Microwave Door",
            "display": "Close the Microwave Door",
            "interval": "Everytime",
            "time": null,
            "delay": 3000,
            "utility_name": "Microwave",
            "component_name": "Door",
            "condition": "Open"
        }, 
        User input : next time 7pm on Wednesday show Happy Birthday Sujendra
        System response :
        {
        
          "userId": 12345,
          "message": "NEXT TIME 7pm on Wednesday SHOW Happy Birthday Sujendra",
          "display": "Happy Birthday Sujendra",
          "interval": "Next Time",
          "time": "2024-03-30T19:00:00.000Z",
          "delay": null,
          "utility_name": null,
          "component_name": null,
          "condition": null
        }, 
        User input : next time 7pm on Wednesday show Happy Birthday Sujendra
        System response :
        {
          "userId": 12345,
          "message": "NEXT TIME 7pm on Wednesday SHOW Happy Birthday Sujendra",
          "display": "Happy Birthday Sujendra",
          "interval": "Next Time",
          "time": "2024-03-30T19:00:00.000Z",
          "utility_name": null,
          "component_name": null,
          "condition": null
        } `,
        model: "gpt-3.5-turbo"
      });
  
      // Display the assistant details as JSON
      console.log(JSON.stringify(assistant, null, 2));
    } catch (error) {
      console.error("Error creating assistant:", error);
    }
  })();