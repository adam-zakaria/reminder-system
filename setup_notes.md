# README_S

There is no 
.env.example

Need pipenv 
pip install pipenv
Also, every started shell needs to pipenv shell to activate env

Probably want to do this is the background
# Start server
uvicorn app:app --reload --port 4005

Kind of weird uvicorn could run, then adam tried to pytest, modules weren't installed, then uvicorn would not run.

pipenv install langchain
pipenv install langchain-community

pytest tests mostly fail
# Run tests
pytest tests/
==== 13 failed, 21 passed, 11 warnings in 36.85s ====

This fails because of Error synchronizing database: ConnectionRefusedError [SequelizeConnectionRefusedError]
cd server_node
npm install
npm start

The setup should be reorder, i.e. there is a section 'Start services in the following order:' but the previous section instructions are listed out of order. And .env is at the bottom.
Also DB_CONNECTION is empty is Environment Setup, but earlier it's said that it's needed

# Port Configuration
is a bit confusing because it leaves wonder about: which of these are set explicitly in env? Because there  is some overlap but not all, i.e. ai caring interface is not set...Probably want to set all in .env

Need to install postgres (OS Specific)
brew install postgresql
brew services start postgresql

On MacOS, your MacOS username is used as the default psql user, i.e. the following works:
psql -U azakaria -d postgres
or shorthand:
psql -d postgres
psql (14.17 (Homebrew))
Type "help" for help.
Then create the mealprepnu db
postgres=# CREATE DATABASE mealprepnu;
CREATE DATABASE
postgres=#

Postgres will run on 5432 by default, use the following to confirm:
➜  meal-prep-nu git:(az) ✗ psql -d postgres -c "SHOW port;"

 port
------
 5432
(1 row)


I would probably do this as a deploy.sh with comments? Then:
# Install

# Deploy
deploy.sh

# Running grpc
pip install grpcio
pipenv install googleapis-common-protos
pipenv install protobuf


Trying:
cd Server_node
npm install
npm start
Errors with complaints about user postgres not existing, so it needs to be created:

# replace azakaria with instance user
psql -U azakaria -d postgres
CREATE ROLE postgres WITH LOGIN SUPERUSER PASSWORD 'your_password';

psql -U azakaria -d postgres -c "CREATE DATABASE ai_caring;"

pipenv install bcrypt # for create_sql_admin.py

change directories from uppercase


Hmmmmm....now:
createDefaultSuperuser(); from Server_node/server.js
is working...not sure what changed. adam manually created super user, then deleted, then ran the server, and now it works.

This did not work, because of complains about dependencies:
# Navigate to webapp directory
cd Webapp/ai-caring-interface
# Install dependencies
npm install
# For production build
npm run build
npm run start

Once the web app is navigated to it errors, complaining about react-refresh, use the fix at the bottom of this page:
https://github.com/facebook/create-react-app/issues/11810
rm -rf node_modules package-lock.json
npm i -g react-refresh
add to package.json:
"overrides": {
    "react-refresh": "0.11.0"
}
and for me npm install did not work, needed
npm install --legacy-peer-deps


For some reason - GRPC Server: 50051
50051 does not show up anywhere in the repo 
Well...in grpc_server.py and grpc_client.py the default is 50052, so perhaps the docs are not up to date
However, grpc_client and 50052 is not referenced elsewhere which questions whether it is used.

# Run in background
pyenv shell
cd bots
pm2 start 'uvicorn app:app --reload --port 4005' --name 'bot_backend'
pm2 start 'python grpc_server' --name 'grpc_server'
cd ../node_backend
pm2 start 'npm start' --name 'node_backend'
cd ../frontend
pm2 logs 'npm run start' --name 'frontend'
