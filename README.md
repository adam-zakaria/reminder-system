# Introduction
This almost definitely does not work perfectly - ask Adam Zakaria for help!

# Install
This needs to be reconciled with ./start.sh, especially the pipenv shell part.

pipenv shell
pipenv install

## Note
The caring-alexa project is getting integrated with the reminder system. The 4o prompting in caring-alexa uses the following packages:
```
httpx==0.27.2 # is required because of some weird openai bug with proxies
openai==1.55.3
```
Currently, this repo does not have versions locked, so it's very possible the current prompt code will not work with the openai package that gets installs.

# Configure
Create a .env with the following:
```
GRPC_PORT=50051
NODE_PORT=7628
OPENAI_API_KEY= <REPLACE_WITH_YOUR_KEY>
```

# Run
./start.sh