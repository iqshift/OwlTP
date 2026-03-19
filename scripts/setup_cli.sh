#!/bin/bash

# This script downloads the latest whatsapp-cli for Linux x64 (inside Docker)
# Run this inside the backend folder OR we will add it to Dockerbuild

echo "Downloading whatsapp-cli..."
curl -L https://github.com/vicentereig/whatsapp-cli/releases/latest/download/whatsapp-cli-linux-amd64 -o whatsapp-cli
chmod +x whatsapp-cli
echo "Done."
