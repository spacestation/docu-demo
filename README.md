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
2. Copy .env.local into .env, change the environment variables
3. Install the dependencies
4. Run the server

## 2. Future Work

- [ ] Add Notion integration
- [ ] Add LLM to generate conversation
