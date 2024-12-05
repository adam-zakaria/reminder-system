#!/bin/bash

set -euo pipefail

# Define variables
LOCAL_DATASTORE_ZIP="/c/Users/sghar/Documents/Research-code-repo/Git/meal-prep-nu/Deployments/build.zip"  # Replace with the correct Windows path to datastore.zip
REMOTE_DATASTORE_ZIP="/home/gharat-su/srv/build.zip"
REMOTE_USER="gharat-su"
REMOTE_HOST="gateway.parcs.northeastern.edu"
REMOTE_PORT=6540
LOG_FILE="./datastore_transfer.log"  # Always log to a file in the current directory

# Ensure log file exists
initialize_log_file() {
    if [[ ! -f "$LOG_FILE" ]]; then
        touch "$LOG_FILE" || {
            echo "Error: Unable to create log file at $LOG_FILE" >&2
            exit 1
        }
    fi
}

# Log messages with timestamps
log() {
    local message="$1"
    echo "$(date +'%Y-%m-%d %H:%M:%S') : $message" | tee -a "$LOG_FILE"
}

# Transfer datastore.zip to the remote server
transfer_datastore_zip() {
    log "Transferring datastore.zip to the remote server..."
    scp -P "$REMOTE_PORT" "$LOCAL_DATASTORE_ZIP" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DATASTORE_ZIP" || {
        log "Error: Failed to transfer datastore.zip to the remote server." >&2
        exit 1
    }
    log "Successfully transferred datastore.zip to the remote server."
}

# Main function
main() {
    initialize_log_file
    log "Starting datastore transfer..."
    transfer_datastore_zip
    log "Datastore transfer completed successfully!"
}

# Execute the main function
main
