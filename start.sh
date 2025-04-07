cd bots
pipenv shell
pm2 start 'uvicorn app:app --reload --port 4005' --name 'bot_backend'
pm2 start 'python grpc_server.py' --name 'grpc_server'
cd ../node_backend
pm2 start 'npm start' --name 'node_backend'
cd ../frontend
pm2 start 'npm run start' --name 'frontend'