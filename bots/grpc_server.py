from concurrent import futures
import grpc
import models.grpc.data_flow_pb2 as data_flow_pb2
import models.grpc.data_flow_pb2_grpc as data_flow_pb2_grpc
from state_machine_executor import StateMachineExecutor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DataFlowServicer(data_flow_pb2_grpc.DataFlowServicer):
    def SendData(self, request, context):
        """
        Processes incoming data from the middleware and executes the state machine.
        """
        try:
            logger.info("Received Data Request")
            if not request.update.home_utilities:
                logger.warning("No home utilities found in the request.")
                return data_flow_pb2.DataResponse(status="error", message="Empty home utilities.")

            state_machine_executor = StateMachineExecutor()

            for home_utility in request.update.home_utilities:
                house_id = home_utility.house_id
                logger.info(f"Processing House ID: {house_id}")

                for utility in home_utility.utilities:
                    try:
                        # Extract utility and component data
                        utility_name = utility.utility_name
                        utility_status = utility.status
                        time_data = str(utility.components[0].time)
                        sensor_data = {utility_name: utility.components[0].value}
                        activity_data = {"utility_id": utility_name, "status": utility_status}

                        logger.info(f"Utility Name: {utility_name}, Status: {utility_status}, Time: {time_data}")
                        logger.debug(f"Sensor Data: {sensor_data}, Activity Data: {activity_data}")

                        # Execute state machine logic
                        result = state_machine_executor.execute_all_state_machines(
                            time=time_data,
                            activity_data=activity_data,
                            sensor_data=sensor_data
                        )

                        logger.info(f"Execution Results for Utility '{utility_name}': {result}")
                    except Exception as utility_error:
                        logger.error(f"Error processing utility '{utility.utility_name}': {utility_error}")
            
            return data_flow_pb2.DataResponse(status="success", message="Data processed and state machines executed.")
        
        except Exception as e:
            logger.error(f"Error in SendData: {e}")
            return data_flow_pb2.DataResponse(status="error", message=str(e))

def serve():
    """
    Start the gRPC server to handle incoming requests.
    """
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    data_flow_pb2_grpc.add_DataFlowServicer_to_server(DataFlowServicer(), server)
    server.add_insecure_port('[::]:50052')
    server.start()
    logger.info("gRPC server running on port 50052.")
    server.wait_for_termination()

if __name__ == "__main__":
    serve()
