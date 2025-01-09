# build environment
FROM node:20.16.0-alpine as build

WORKDIR /app

COPY package.json ./

# Get the dependencies
RUN yarn

# Add bin to path
ENV PATH /app/node_modules/.bin:$PATH

# Rest of the project directories
COPY ./ ./

# Build
RUN yarn build

################################
#### PRODUCTION ENVIRONMENT ####
################################

# Use the official NGINX image for production
FROM node:20.16.0-alpine as production

WORKDIR /app

EXPOSE 3000

# Define build arguments for environment variables
ARG GCLOUD_OAUTH_CLIENT_ID
ARG GOOGLE_DRIVE_API_KEY
ARG GMAIL_API_KEY
ARG GOOGLE_PROJECT_ID
ARG COMPANION_URL
ARG GCS_ENDPOINT


# Set environment variables at build
ENV GCLOUD_OAUTH_CLIENT_ID=$GCLOUD_OAUTH_CLIENT_ID
ENV GOOGLE_DRIVE_API_KEY=$GOOGLE_DRIVE_API_KEY
ENV GMAIL_API_KEY=$GMAIL_API_KEY
ENV GOOGLE_PROJECT_ID=$GOOGLE_PROJECT_ID
ENV COMPANION_URL=$COMPANION_URL
ENV GCS_ENDPOINT=$GCS_ENDPOINT


# copy nginx configuration in side conf.d folder
COPY --from=build /app/package.json /app/package.json
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/build /app/build

ENTRYPOINT ["yarn", "start"]
