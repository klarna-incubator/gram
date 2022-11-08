FROM <some node 16 img> as builder

WORKDIR /home/gram
USER root

ADD app .

# Build the react app

# This value is not secret and accessible in the frontend. 
# ENV REACT_APP_SENTRY_DSN=""
RUN npm i --loglevel=warn --no-progress
RUN npm run build

FROM <some node 16 img>

WORKDIR /home/gram
USER root

EXPOSE 8080 8081

ADD api .

RUN npm i --loglevel=warn --no-progress

RUN npm run build

COPY --from=builder /home/gram/build ./frontend/

# Remove dev dependencies (needed typescript to build)
RUN npm prune --production

# gram user needs write access to the assets folder in order to set up the symlinks
# however when we use ADD all files are owned by root and not writeable by anyone but root, so we need to 
# swap here briefly to root to fix the permissions.
USER root 

RUN chown gram:gram assets

# drop back to gram
USER gram

CMD ["npm", "run", "docker-start"]
