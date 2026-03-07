FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json tsconfig.json ./

# Install dependencies
# Using npm ci for cleaner production install if package-lock exists, 
# but since I don't see one in the file list, regular install is safer for now.
RUN npm install

# Copy source code
COPY src ./src
COPY scripts ./scripts

# Build the application
RUN npm run build

# Expose the API port
EXPOSE 8080

# Start the application
CMD ["npm", "start"]
