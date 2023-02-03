# FROM node:16-alpine as builder

# WORKDIR /home/gram

# ADD app .

# Build the react app
FROM node:16-alpine

WORKDIR /home/gram

USER root

ADD package.json .
ADD package-lock.json .
ADD lerna.json .
ADD tsconfig.json .
ADD tsconfig.build.json .

ADD api api
ADD app app
ADD core core
ADD config config
ADD plugins plugins

# This value is not secret and accessible in the frontend. 
# ENV REACT_APP_SENTRY_DSN=""
RUN npm i --loglevel=warn --no-progress
RUN npm run build

# COPY --from=builder 
RUN cp -r /home/gram/app/build ./frontend/

# Remove dev dependencies (needed typescript and types to build)
RUN npm prune --omit=dev

# gram user needs write access to the assets folder in order to set up the symlinks
# however when we use ADD all files are owned by root and not writeable by anyone but root, so we need to 
# swap here briefly to root to fix the permissions.
# USER root 

RUN addgroup -S gram && adduser -S gram -G gram

RUN chown gram:gram api/assets

# drop back to gram
USER gram
EXPOSE 8080 8081
CMD ["npm", "run", "docker-start"]
