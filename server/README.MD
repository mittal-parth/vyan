## Installation Guide

### Install dependencies

```bash
python3 -m venv venv # create a virtual environment
source venv/bin/activate # activate the virtual environment
pip install -r requirements.txt # install dependencies
```

### Run the server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000 # run the server on port 8000
```

### Test the server

```bash
curl http://localhost:8000/
```