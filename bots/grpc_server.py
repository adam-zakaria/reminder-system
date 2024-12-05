from concurrent import futures
import grpc
import data_flow_pb2
import data_flow_pb2_grpc
from state_machine_executor import execute_all_state_machines  # Import state machine logic

class DataFlowServicer(data_flow_pb2_grpc.DataFlowServicer):
    def SendData(self, request, context):
        """Processes incoming data from the middleware and executes the state machine."""
        try:
            # Log received data for monitoring
            print("Received Data Request:")
            print(f"House ID: {request.update.home_utilities[0].house_id}")

            for home_utility in request.update.home_utilities:
                for utility in home_utility.utilities:
                    print(f"Utility Name: {utility.utility_name}, Status: {utility.status}")
                    
                    # Prepare data to send to state machine execution function
                    time_data = str(utility.components[0].time)
                    activity_data = {"utility_id": utility.utility_name, "status": utility.status}
                    sensor_data = {utility.utility_name: utility.components[0].value}
                    
                    # Run state machine logic here
                    result = execute_all_state_machines(
                        time=time_data,
                        activity_data=activity_data,
                        sensor_data=sensor_data
                    )

                    print(result,"execution of statemachine")
                    
            return data_flow_pb2.DataResponse(status="success", message="Data processed and state machine executed.")
        except Exception as e:
            return data_flow_pb2.DataResponse(status="error", message=str(e))

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    data_flow_pb2_grpc.add_DataFlowServicer_to_server(DataFlowServicer(), server)
    server.add_insecure_port('[::]:50052')
    server.start()
    print("gRPC server running on port 50052.")
    server.wait_for_termination()

if __name__ == "__main__":
    serve()
