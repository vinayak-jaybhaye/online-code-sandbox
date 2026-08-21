FROM python:3.11-slim

# Create non-root user for sandboxed execution
RUN groupadd -r sandbox && useradd -r -g sandbox -d /sandbox -s /bin/false sandbox

WORKDIR /sandbox

# Switch to non-root user
USER sandbox

# Source code is mounted at /sandbox/main.py at runtime
ENTRYPOINT ["python", "/sandbox/main.py"]
