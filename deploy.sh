#!/usr/bin/env bash

# Variables
REACT_NATIVE_PROJECT_PATH="/c/Users/sghar/Documents/Research-code-repo/Git/meal-prep-nu/Webapp/ai-caring-interface"
NODE_SERVER_PATH="/c/Users/sghar/Documents/Research-code-repo/Git/meal-prep-nu/Server_node"
BUILD_OUTPUT_PATH="$REACT_NATIVE_PROJECT_PATH/build"
BUILD_ZIP_PATH="/c/Users/sghar/Documents/Research-code-repo/Git/meal-prep-nu/Deployments/build.zip"
SERVER_ZIP_PATH="/c/Users/sghar/Documents/Research-code-repo/Git/meal-prep-nu/Deployments/server.zip"
REMOTE_USER="gharat-su"
REMOTE_HOST="gateway.parcs.northeastern.edu"
REMOTE_PORT=6540
REMOTE_PATH="/home/gharat-su/srv/"

# Step 1: Check if Node.js and npm are installed
if ! command -v npx &> /dev/null; then
  echo "npx could not be found. Please install Node.js and React Native CLI first."
  exit 1
fi

# Step 2: Check if zip command is available
if ! command -v zip &> /dev/null; then
  echo "zip command not found. Please install zip manually for Git Bash on Windows."
  exit 1
fi

# Step 3: Create a build for the React Native project
echo "Creating React Native build..."
cd "$REACT_NATIVE_PROJECT_PATH" || exit 1
npm run build || exit 1

# Step 4: Zip the React Native build
echo "Zipping React Native build..."
cd "$BUILD_OUTPUT_PATH" || exit 1
zip -r "$BUILD_ZIP_PATH" . || exit 1

# Step 5: Zip the server's Node.js folder, excluding node_modules and package-lock.json
echo "Zipping Node.js server folder..."
cd "$NODE_SERVER_PATH" || exit 1
zip -r "$SERVER_ZIP_PATH" . -x "node_modules/*" -x "package-lock.json" || exit 1

# Step 6: Transfer files to the remote server
echo "Transferring files to remote server..."
scp -P "$REMOTE_PORT" "$BUILD_ZIP_PATH" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH" || exit 1
scp -P "$REMOTE_PORT" "$SERVER_ZIP_PATH" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH" || exit 1

echo "Deployment completed successfully."