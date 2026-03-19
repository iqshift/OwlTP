# Stage 1: Build whatsapp-cli from local source
FROM golang:1.24-bookworm AS cli-builder
WORKDIR /src/whatsapp-cli
COPY ./whatsapp-cli .
RUN go mod download && go build -o /usr/local/bin/whatsapp-cli main.go

# Stage 2: Final Backend Image
FROM python:3.12-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    iputils-ping \
    libsqlite3-0 \
    sqlite3 \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Copy binary from builder stage
COPY --from=cli-builder /usr/local/bin/whatsapp-cli /usr/local/bin/whatsapp-cli
RUN chmod +x /usr/local/bin/whatsapp-cli

# Copy requirements and install (adjusted path because context is now root)
COPY ./backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY ./backend .

# Copy entrypoint script and make it executable
COPY ./docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create sessions directory with full permissions
RUN mkdir -p /sessions && chmod 777 /sessions

# Exposure
EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
