FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all files
COPY . .

# Setup directories
RUN node scripts/setup.js

# Volume for persistent input and output
VOLUME [ "/app/input", "/app/Fonts" ]

# Default command
CMD ["npm", "run", "build"]