FROM l-docker-klarna-production.artifactory.klarna.net/klarna/node:16.202307241340-builder AS builder

USER root

WORKDIR /tmp/app

# USER root

RUN mkdir assets

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
ENV REACT_APP_SENTRY_DSN="https://c469b8a74d3f4abe8aad090b51c7dc0e@o24547.ingest.sentry.io/6236788"
RUN NODE_ENV=dev npm ci
RUN npm run build

RUN cp -r /tmp/app/app/build ./frontend/
RUN cp api/assets/* assets/

# Remove dev dependencies (needed typescript and types to build)
RUN npm prune --omit=dev


FROM l-docker-klarna-production.artifactory.klarna.net/klarna/node:16.202307241340

USER klarna

WORKDIR /opt/app

# # copy over the yarn cache to speed up the second install
# COPY --from=builder --chown=klarna:klarna /root/.yarn /home/klarna/.yarn

# copy over the build dir and other relevant files
COPY --from=builder /tmp/app/ .

# RUN cp api/assets/* assets/
USER root
RUN chown klarna:klarna assets

# drop back to gram
USER klarna

EXPOSE 8080 8081

CMD ["npm", "run", "docker-start"]
