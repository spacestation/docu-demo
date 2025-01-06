podman run \
  --name=companion \
  --rm \
  -p 0.0.0.0:3020:3020 \
  -v /Users/paul/dev/drive-integration/tmp/companion:/data/companion:z \
  -e COMPANION_CLIENT_ORIGINS="true" \
  -e COMPANION_SECRET="secret" \
  -e COMPANION_DOMAIN="localhost:3020" \
  -e COMPANION_DATADIR="/data/companion" \
  -e COMPANION_ENABLE_GOOGLE_PICKER_ENDPOINT="true" \
  -e COMPANION_AWS_BUCKET="spacestation-labs-companion" \
  -e COMPANION_AWS_ENDPOINT="https://storage.googleapis.com/" \
  -e COMPANION_AWS_KEY="GOOG1EDCXZ62F4LFPRQP656MFK6BJFM57ZVNESJ7OMFR2MFVSLNSUR453R7H7" \
  -e COMPANION_AWS_SECRET="Smh/z4RXbQwUSxT8G/hhjNeAweuGxVCR43C4n49I" \
  -e COMPANION_AWS_REGION="us" \
  -e COMPANION_GOOGLE_KEY="962583979766-3512is6mj2h81orc3tdfbn0qnvrdn28b.apps.googleusercontent.com" \
  -e COMPANION_GOOGLE_SECRET="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" \
  transloadit/companion
