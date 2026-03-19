#!/bin/sh
# Fix sessions directory permissions on every container start
chmod -R 777 /sessions 2>/dev/null || true
# Run the main application
exec "$@"
