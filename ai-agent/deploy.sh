#!/bin/bash

echo "🚀 Deploying Vyan AI Agent..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please copy env.example to .env and configure it."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "🎯 AI Agent is ready to run with: npm start"
else
    echo "❌ Build failed!"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
