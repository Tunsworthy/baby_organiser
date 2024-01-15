# Use the official Node.js 16 image.
# If you require a different version of Node.js, replace '16' with your desired version.
FROM node:16-alpine

# Create app directory inside the container
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# If you're using yarn package manager, use the following line instead of npm install
# RUN yarn install --frozen-lockfile
RUN npm install

# Bundle app source inside Docker image
COPY . .

# Your app binds to port 3000 so you'll use the EXPOSE instruction to have it mapped by the docker daemon
EXPOSE 3000

# Define the command to run your app using CMD which defines your runtime
CMD [ "node", "server.js" ]
