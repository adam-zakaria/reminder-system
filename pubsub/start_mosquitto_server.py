import subprocess

def start_mosquitto_server():
    cmd = "\"C:\\Program Files\\mosquitto\\mosquitto.exe\" -v"
    process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    stdout, stderr = process.communicate()

    if process.returncode == 0:
        print("Mosquitto server started successfully.")
        print("Server logs:\n", stdout.decode())
    else:
        print("Failed to start Mosquitto server.")
        print("Error:\n", stderr.decode())

start_mosquitto_server()
