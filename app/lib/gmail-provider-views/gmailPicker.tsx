import { decode } from "js-base64";

const injectedScripts = new Set<string>();
let driveApiLoaded = false;

export class InvalidTokenError extends Error {
  constructor() {
    super("Invalid or expired token");
    this.name = "InvalidTokenError";
  }
}

interface MessageListMessage {
  id: string;
  threadId: string;
}

export interface Message {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  sizeEstimate: number;
  raw: string;
  payload: MessagePart;
}

export interface MessagePart {
  partId: string;
  mimeType: string;
  filename: string;
  headers: {
    name: string;
    value: string;
  }[];
  body: MessagePartBody;
  parts: MessagePart[];
}

export interface MessagePartBody {
  attachmentId: string;
  size: number;
  data: string;
}

// https://stackoverflow.com/a/39008859/6519037
async function injectScript(src: string) {
  if (injectedScripts.has(src)) return;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", (e) => reject(e.error));
    document.head.appendChild(script);
  });
  injectedScripts.add(src);
}

const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest";
const API_KEY = "";

export async function ensureScriptsInjected(): Promise<void> {
  await Promise.all([
    injectScript("https://accounts.google.com/gsi/client"), // Google Identity Services
    (async () => {
      await injectScript("https://apis.google.com/js/api.js");

      await new Promise<void>((resolve) =>
        gapi.load("client", async () => {
          await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: [DISCOVERY_DOC],
          });
          resolve();
        })
      );
      //   await gapi.client.load(
      //     "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
      //   );
      driveApiLoaded = true;
    })(),
  ]);
}

export async function isTokenValid(
  accessToken: string,
  signal: AbortSignal | undefined
) {
  const response = await fetch(
    `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(
      accessToken
    )}`,
    { signal }
  );
  if (response.ok) {
    return true;
  }
  // console.warn('Token is invalid or expired:', response.status, await response.text());
  // Token is invalid or expired
  return false;
}

export async function logout(accessToken: string): Promise<void> {
  await new Promise<void>((resolve) =>
    google.accounts.oauth2.revoke(accessToken, resolve)
  );
}

export async function authorize({
  clientId,
  accessToken,
}: {
  clientId: string;
  accessToken?: string | null | undefined;
}): Promise<string> {
  const response = await new Promise<google.accounts.oauth2.TokenResponse>(
    (resolve, reject) => {
      const scopes = ["https://www.googleapis.com/auth/gmail.readonly"];

      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        // Authorization scopes required by the API; multiple scopes can be included, separated by spaces.
        scope: scopes.join(" "),
        callback: resolve,
        error_callback: reject,
      });

      if (accessToken === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({ prompt: "consent" });
      } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({ prompt: "" });
      }
    }
  );

  if (response.error) {
    throw new Error(`OAuth2 error: ${response.error}`);
  }
  return response.access_token;
}

export async function fetchMessages({
  query,
  token,
  signal,
}: {
  query: string;
  token: string;
  signal: AbortSignal | undefined;
}) {
  if (!(await isTokenValid(token, signal))) {
    throw new InvalidTokenError();
  }
  const response = await gapi.client.gmail.users.messages.list({
    userId: "me",
    // labelIds: "INBOX",
    q: query,
    maxResults: 10,
  });

  let promises = [];
  for (let message of response.result.messages as MessageListMessage[]) {
    promises.push(getMessage({ token, messageId: message.id, signal }));
  }

  const messageResponses = await Promise.all(promises);
  return messageResponses as Message[];
}

export async function getMessage({
  token,
  messageId,
  signal,
}: {
  token: string;
  messageId: string;
  signal: AbortSignal | undefined;
}) {
  if (!(await isTokenValid(token, signal))) {
    throw new InvalidTokenError();
  }

  const response = await gapi.client.gmail.users.messages.get({
    userId: "me",
    id: messageId,
  });

  return response.result as Message;
}
