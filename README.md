# Document Chat + RAG

This is a simple email RAG system that uses the any custom API to generate
contextual search results for emails in your Gmail inbox.

This repo extends Uppy React SDK to add a Gmail inbox picker and a
button to upload emails to the S3 bucket.

At the core it uses the [Uppy Companion](https://uppy.io/docs/companion/)
to upload email markdowns to a S3 compatible bucket and then uses the
any RAG API to generate contextual search results.

RAG API is currently set to [Minerva](https://minerva.alexlazar.dev/docs#/)
but can be easily swapped out for any other RAG API.

For a demo, see [here](https://chat.spacestationlabs.com).

## 1. Setup

1. Clone the repository
2. Copy .env.example into .env, change the environment variables
3. Install the dependencies
4. Run the server

## 2. Running the project

You'll need to spin up the companion app, I run it via docker (podman)
```
podman run \
  --name=companion \
  --rm \
  -p 0.0.0.0:3020:3020 \
  -v /Users/dev/drive-integration/tmp/companion:/data/companion:z \
  -e COMPANION_CLIENT_ORIGINS="true" \
  -e COMPANION_SECRET="" \
  -e COMPANION_DOMAIN="" \
  -e COMPANION_DATADIR="/data/companion" \
  -e COMPANION_ENABLE_GOOGLE_PICKER_ENDPOINT="true" \
  -e COMPANION_AWS_BUCKET="" \
  -e COMPANION_AWS_ENDPOINT="" \
  -e COMPANION_AWS_KEY="" \
  -e COMPANION_AWS_SECRET="" \
  -e COMPANION_GOOGLE_KEY="" \
  -e COMPANION_GOOGLE_SECRET="" \
  transloadit/companion
```

You might also have to set up cors for your S3 bucket
```
[
  {
    "origin": [
      "http://localhost:5173",
      "https://yourdomain.com",
    ],
    "method": ["GET", "PUT", "POST"],
    "maxAgeSeconds": 3000,
    "responseHeader": [
      "Authorization",
      "x-amz-date",
      "x-amz-content-sha256",
      "content-type",
      "location"
    ]
  },
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3000,
    "responseHeader": ["Content-Type", "Location"]
  }
]

```

Lastly, just run `yarn dev` locally to start.

## 3. Future Work

- [ ] Add Notion integration
- [ ] Add LLM to generate conversation
