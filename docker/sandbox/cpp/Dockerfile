FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y g++ && rm -rf /var/lib/apt/lists/*
RUN groupadd -r sandbox && useradd -r -g sandbox -d /sandbox -s /bin/false sandbox
WORKDIR /sandbox
