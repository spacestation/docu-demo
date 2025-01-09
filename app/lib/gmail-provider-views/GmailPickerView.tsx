import { h } from "preact";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import type { AsyncStore, Uppy } from "@uppy/core/lib/Uppy.js";
import AuthView from "@uppy/provider-views/lib/ProviderView/AuthView";

import {
  ensureScriptsInjected,
  authorize,
  isTokenValid,
  InvalidTokenError,
  fetchMessages,
  getMessage,
  logout,
  Message,
} from "./gmailPicker";
import GmailIcon from "./icon";

function decodeHtmlEntities(text: string) {
  const entities: Record<string, string> = {
    "&#39;": "'",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&nbsp;": " ",
    "&#x2F;": "/",
    "&#x27;": "'",
    "&#x60;": "`",
  };

  return decodeURIComponent(text).replace(
    /&#?\w+;/g,
    (entity) => entities[entity] || entity
  );
}

function useStore(
  store: AsyncStore,
  key: string
): [string | undefined | null, (v: string | null) => Promise<void>] {
  const [value, setValueState] = useState<string | null | undefined>();
  useEffect(() => {
    (async () => {
      setValueState(await store.getItem(key));
    })();
  }, [key, store]);

  const setValue = useCallback(
    async (v: string | null) => {
      setValueState(v);
      if (v == null) {
        return store.removeItem(key);
      }
      return store.setItem(key, v);
    },
    [key, store]
  );

  return [value, setValue];
}

export type GmailPickerViewProps = {
  uppy: Uppy<any, any>;
  clientId: string;
  storage: AsyncStore;
  onEmailPicked: (emails: Message[]) => void;
};

export type PickedItem = {
  id: string;
  name: string;
  url: string;
};

export default function GmailPickerView({
  clientId,
  uppy,
  storage,
  onEmailPicked,
}: GmailPickerViewProps) {
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessTokenStored] = useStore(
    storage,
    "uppy:google-gmail-picker:accessToken"
  );
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(
    new Set()
  );

  const accessTokenRef = useRef(accessToken);

  const setAccessToken = useCallback(
    (t: string | null) => {
      uppy.log("Access token updated");
      setAccessTokenStored(t);
      accessTokenRef.current = t;
    },
    [setAccessTokenStored, uppy]
  );

  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    (async () => {
      setLoading(true);

      await ensureScriptsInjected();
      try {
        let newAccessToken = accessToken;
        if (newAccessToken == null) {
          newAccessToken = await authorize({ clientId });
        }
        setAccessToken(newAccessToken);
      } catch (err) {
        if (
          err instanceof Error &&
          "type" in err &&
          err.type === "popup_closed"
        ) {
          // user closed the auth popup, ignore
        } else {
          setAccessToken(null);
          uppy.log(err);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  const searchMessages = useCallback(
    async (query: string, signal?: AbortSignal) => {
      setLoading(true);
      setMessages([]);

      try {
        const messages = await fetchMessages({
          query,
          token: accessToken as string,
          signal,
        });
        setMessages(messages);
      } catch (err) {
        if (err instanceof InvalidTokenError) {
          uppy.log("Token is invalid or expired, reauthenticating");
          const newAccessToken = await authorize({
            accessToken: accessToken,
            clientId,
          });
          const messages = await fetchMessages({
            query,
            token: newAccessToken,
            signal,
          });
          setMessages(messages);
          setAccessToken(newAccessToken);
        } else {
          throw err;
        }
      } finally {
        setLoading(false);
      }
    },
    [accessToken, setAccessToken, uppy]
  );

  const toggleMessageSelection = useCallback((messageId: string) => {
    setSelectedMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  const handleLogoutClick = useCallback(async () => {
    if (accessToken) {
      await logout(accessToken);
      setAccessToken(null);
    }
  }, [accessToken, setAccessToken]);

  if (accessToken == null) {
    return h(AuthView, {
      pluginName: "Gmail",
      pluginIcon: GmailIcon,
      handleAuth: async () => {},
      i18n: uppy.i18n,
      loading: loading,
    });
  }

  return h(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        height: "100%",
        width: "100%",
        padding: "16px",
        overflow: "hidden",
        backgroundColor: "white",
      },
    },
    h(
      "form",
      {
        style: {
          display: "flex",
          gap: "8px",
          marginBottom: "16px",
        },
        onSubmit: (e) => {
          e.preventDefault();
          const input = e.currentTarget.querySelector("input");
          if (input) {
            searchMessages(input.value);
          }
        },
      },
      h("input", {
        type: "text",
        placeholder: "Search emails...",
        style: {
          flex: 1,
          padding: "8px",
          border: "1px solid #ccc",
          borderRadius: "4px",
        },
      }),
      h(
        "button",
        {
          type: "submit",
          className: "uppy-u-reset uppy-c-btn",
          disabled: loading,
          style: {
            padding: "8px 16px",
            backgroundColor: "#1a73e8",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          },
        },
        "Search"
      )
    ),
    h(
      "div",
      {
        style: {
          flex: 1,
          overflowY: "auto",
          border: "1px solid #eee",
          borderRadius: "4px",
          padding: "8px",
          maxHeight: "323px",
        },
      },
      messages.map((message) =>
        h(
          "div",
          {
            key: message.id,
            style: {
              padding: "12px",
              borderBottom: "1px solid #eee",
              cursor: "pointer",
              backgroundColor: selectedMessages.has(message.id)
                ? "#f1f7fe"
                : "transparent",
              "&:hover": {
                backgroundColor: selectedMessages.has(message.id)
                  ? "#e3f0fd"
                  : "#f8f9fa",
              },
              width: "100%",
              maxWidth: "100%",
            },
            onClick: () => toggleMessageSelection(message.id),
          },
          h(
            "div",
            {
              style: {
                display: "flex",
                gap: "8px",
                alignItems: "center",
                marginBottom: "4px",
                width: "100%",
              },
            },
            h("input", {
              type: "checkbox",
              checked: selectedMessages.has(message.id),
              onClick: (e: Event) => {
                e.stopPropagation();
              },
              onChange: (e: Event) => {
                e.stopPropagation();
                toggleMessageSelection(message.id);
              },
              style: {
                cursor: "pointer",
                width: "16px",
                height: "16px",
              },
            }),
            h(
              "div",
              {
                style: {
                  fontWeight: "500",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: "150px",
                  maxWidth: "150px",
                  lineHeight: "1.25rem",
                },
              },
              (
                message.payload.headers.find((h: any) => h.name === "From")
                  ?.value || "Unknown Sender"
              )
                .replace(/<[^>]+>/, "")
                .trim()
            ),
            h(
              "div",
              {
                style: {
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "#666",
                  lineHeight: "1.25rem",
                },
              },
              message.payload.headers.find((h: any) => h.name === "Subject")
                ?.value || "No Subject"
            )
          ),
          h(
            "div",
            {
              style: {
                color: "#666",
                fontSize: "14px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "100%",
                lineHeight: "1.25rem",
              },
            },
            decodeHtmlEntities(message.snippet || "No preview available")
          )
        )
      )
    ),

    h(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          marginTop: "16px",
          gap: "8px",
        },
      },
      h(
        "button",
        {
          type: "button",
          className: "uppy-u-reset uppy-c-btn uppy-c-btn-primary",
          disabled: loading || selectedMessages.size === 0,
          style: {
            padding: "8px 16px",
            backgroundColor: "#1a73e8",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: selectedMessages.size === 0 ? "not-allowed" : "pointer",
            opacity: selectedMessages.size === 0 ? 0.6 : 1,
          },
          onClick: () => {
            onEmailPicked(
              Array.from(selectedMessages).map((id) =>
                messages.find((m) => m.id === id)
              )
            );
          },
        },
        `Upload ${
          selectedMessages.size ? `(${selectedMessages.size})` : ""
        } Emails`
      ),
      h(
        "button",
        {
          type: "button",
          className: "uppy-u-reset uppy-c-btn",
          disabled: loading,
          onClick: handleLogoutClick,
          style: {
            padding: "8px 16px",
            backgroundColor: "#f8f9fa",
            color: "#666",
            border: "1px solid #ddd",
            borderRadius: "4px",
            cursor: "pointer",
          },
        },
        "Log out"
      )
    )
  );
}
