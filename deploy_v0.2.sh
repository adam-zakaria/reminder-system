#!/usr/bin/env bash

set -euo pipefail

# Global Variables
REACT_NATIVE_PROJECT_PATH="/c/Users/sghar/Documents/Research-code-repo/Git/meal-prep-nu/Webapp/ai-caring-interface"
NODE_SERVER_PATH="/c/Users/sghar/Documents/Research-code-repo/Git/meal-prep-nu/Server_node"
BOTS_SERVER_PATH="/c/Users/sghar/Documents/Research-code-repo/Git/meal-prep-nu/bots"
BUILD_OUTPUT_PATH="$REACT_NATIVE_PROJECT_PATH/build"
BUILD_ZIP_PATH="/c/Users/sghar/Documents/Research-code-repo/Git/meal-prep-nu/Deployments/build.zip"
SERVER_ZIP_PATH="/c/Users/sghar/Documents/Research-code-repo/Git/meal-prep-nu/Deployments/server.zip"
BOTS_ZIP_PATH="/c/Users/sghar/Documents/Research-code-repo/Git/meal-prep-nu/Deployments/bots.zip"
REMOTE_USER="gharat-su"
REMOTE_HOST="gateway.parcs.northeastern.edu"
REMOTE_PORT=6540
REMOTE_PATH="/home/gharat-su/srv/"

# Functions

function check_command() {
    local cmd="$1"
    if ! command -v "$cmd" &> /dev/null; then
        printf "Error: %s is not installed. Please install it and try again.\n" "$cmd" >&2
        exit 1
    fi
}

function validate_directory() {
    local dir="$1"
    if [[ ! -d "$dir" ]]; then
        printf "Error: Directory %s does not exist.\n" "$dir" >&2
        exit 1
    fi
}

function create_build() {
    printf "Creating React Native build...\n"
    cd "$REACT_NATIVE_PROJECT_PATH" || return 1
    npm run build || return 1
}

function zip_directory() {
    local dir_path="$1"
    local zip_path="$2"
    local exclude_patterns=("${@:3}")

    printf "Zipping directory: %s\n" "$dir_path"
    validate_directory "$dir_path"
    cd "$dir_path" || return 1

    local exclude_args=()
    for pattern in "${exclude_patterns[@]}"; do
        exclude_args+=(-x "$pattern")
    done

    zip -r "$zip_path" . "${exclude_args[@]}" || return 1
}

function transfer_files() {
    printf "Transferring files to remote server...\n"
    scp -P "$REMOTE_PORT" "$BUILD_ZIP_PATH" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH" || return 1
    scp -P "$REMOTE_PORT" "$SERVER_ZIP_PATH" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH" || return 1
    scp -P "$REMOTE_PORT" "$BOTS_ZIP_PATH" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_PATH" || return 1
}

function main() {
    printf "Starting deployment process...\n"
    
    # Validate environment
    check_command "npx"
    check_command "zip"
    check_command "scp"
    
    # Perform tasks
    create_build || { printf "Failed to create React Native build.\n" >&2; exit 1; }
    zip_directory "$BUILD_OUTPUT_PATH" "$BUILD_ZIP_PATH" || { printf "Failed to zip React Native build.\n" >&2; exit 1; }
    zip_directory "$NODE_SERVER_PATH" "$SERVER_ZIP_PATH" "node_modules/*" "package-lock.json" || { printf "Failed to zip Node.js server folder.\n" >&2; exit 1; }
    zip_directory "$BOTS_SERVER_PATH" "$BOTS_ZIP_PATH" "node_modules/*" "package-lock.json" || { printf "Failed to zip bots folder.\n" >&2; exit 1; }
    transfer_files || { printf "File transfer to remote server failed.\n" >&2; exit 1; }
    
    printf "Deployment completed successfully.\n"
}

# Execute main function
main
