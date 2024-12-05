import json
import time
import grpc
import data_flow_pb2
import data_flow_pb2_grpc

# Path to the JSON file
JSON_FILE_PATH = 'sensor_sequence.json'

# gRPC server address
GRPC_SERVER_ADDRESS = 'localhost:50052'

TARGET_UTILITY_IDS = {"0015BC001E00CA5F", "0015BC001E01211C", "0015BC001E011FA2", "0015BC001E011D"}

def load_json_data(file_path):
    """Load data from a JSON file."""
    try:
        with open(file_path, 'r') as file:
            return json.load(file)
    except (FileNotFoundError, json.JSONDecodeError) as e:
        print(f"Error loading JSON data: {e}")
        return []

def adjust_status(status):
    """Adjust status to 'open' or 'closed' based on the provided status."""
    return "open" if status == "On" else "closed"

def build_data_request(element):
    """Build a gRPC DataRequest message from JSON data."""
    update = data_flow_pb2.Update(
        home_utilities=[
            data_flow_pb2.HomeUtility(
                house_id=home_utility['house_id'],
                utilities=[
                    data_flow_pb2.Utility(
                        utility_id=utility['utility_id'],
                        utility_name=utility['utility_name'],
                        location=utility['location'],
                        status=adjust_status(utility['status']) 
                                if utility['utility_id'] in TARGET_UTILITY_IDS else utility['status'],
                        group=utility['group'],
                        components=[
                            data_flow_pb2.Component(
                                component_name=component['component_name'],
                                status=component['status'],
                                value=component['value'],
                                time=component['time']
                            ) for component in utility.get('components', [])
                        ]
                    ) for utility in home_utility.get('utilities', [])
                ]
            ) for home_utility in element.get('update', {}).get('home_utilities', [])
        ]
    )
    return data_flow_pb2.DataRequest(update=update)

def send_data_via_grpc(data):
    """Send data to the gRPC server using gRPC protocol."""
    with grpc.insecure_channel(GRPC_SERVER_ADDRESS) as channel:
        stub = data_flow_pb2_grpc.DataFlowStub(channel)

        for element in data:
            request = build_data_request(element)
            try:
                response = stub.SendData(request)
                print(f'Response from gRPC server: {response.status}, Message: {response.message}')
            except grpc.RpcError as e:
                print(f'Error sending data via gRPC: {e.details()}')

def send_data_continuously():
    """Continuously send data loaded from a JSON file via gRPC."""
    data = load_json_data(JSON_FILE_PATH)
    if data:
        send_data_via_grpc(data)
    else:
        print("No valid data to send.")

if __name__ == "__main__":
    send_data_continuously()
