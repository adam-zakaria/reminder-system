# Introduction
This almost definitely does not work perfectly - ask Adam Zakaria for help!

# Install (See Note for more)
cd bots
pipenv shell
pipenv install


## Note
The caring-alexa project is getting integrated with the reminder system. The 4o prompting in caring-alexa uses the following packages:
```
httpx==0.27.2 # is required because of some weird openai bug with proxies
openai==1.55.3
```
Currently, this repo does not have versions locked, so it's very possible the current prompt code will not work with the openai package that gets installs.

(1) This needs to be reconciled with ./start.sh, especially the pipenv shell part. And maybe the project root Pipfile and the bots Pipfile should be reconciled as well. Depending on how the project is organized. There are a few python folders, and whether or not these should all be the same project is unclear. Imports will be relative to the dir of the Pipfile active.

# Configure
Create a .env with the following:
```
GRPC_PORT=50051
NODE_PORT=7628
OPENAI_API_KEY= <REPLACE_WITH_YOUR_KEY>
```

# Run reminder system
This script is actually broken - the commands work, but must be run manually.
```
./start.sh
```

# Run iOS app
In XCode open:
`/Users/azakaria/Code/neu/reminder-system/iOS Application/MealPrep.xcodeproj`
* Select iPad 10th generation in the top middle bar.
* Press run icon.


# AWS Installation
## Copy the bashrc

## Install python reqs
sudo apt update && sudo apt install -y build-essential libssl-dev zlib1g-dev libbz2-dev libreadline-dev libsqlite3-dev curl llvm libncurses5-dev libncursesw5-dev xz-utils tk-dev libffi-dev liblzma-dev python3-openssl

pyenv install 3.11
source ~/.bashrc
pyenv global 3.11
python -m pip install pipenv

