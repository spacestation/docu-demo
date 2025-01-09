import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CopyIcon, CornerDownLeft, FileIcon, Upload } from "lucide-react";
import {
  ChatBubble,
  ChatBubbleAction,
  ChatBubbleAvatar,
  ChatBubbleMessage,
} from "~/components/ui/chat/chat-bubble";
import { ChatInput } from "~/components/ui/chat/chat-input";
import { ChatMessageList } from "~/components/ui/chat/chat-message-list";
import { Button } from "~/components/ui/button";
import { useSearchMutation, useGetDocumentStatsQuery } from "~/store/api";
import { SearchResult } from "~/types/search";

const ChatAiIcons = [
  {
    icon: CopyIcon,
    label: "Copy",
  },
  //   {
  //     icon: RefreshCcw,
  //     label: "Refresh",
  //   },
];

const FileCard: React.FC<{ file: SearchResult }> = ({ file }) => {
  const filename = file.metadata.source.split("/").pop();
  const cleanFilename = filename?.replace(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/,
    ""
  );
  return (
    <div className='flex-shrink-0 w-64 p-4 mr-4 bg-white rounded-lg shadow-md'>
      <div className='flex items-center mb-2'>
        <FileIcon className='w-5 h-5 mr-2 text-blue-500' />
        <h3 className='font-medium truncate'>{cleanFilename}</h3>
      </div>
      <p className='text-sm text-gray-600 mb-2 line-clamp-2'>{file.text}</p>
      <div className='flex justify-between text-xs text-gray-500'>
        <span>Markdown</span>
        <span>{new Date(file.metadata.embedded_at).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

function Messenger({ onUpload }: { onUpload: () => void }) {
  const [search, { isLoading }] = useSearchMutation();
  const [messages, setMessages] = useState<
    {
      role: string;
      content: string;
      results?: SearchResult[];
    }[]
  >([
    {
      role: "assistant",
      content: `Hello, how can I help you today? I'm a chatbot that has access to the files you upload.`,
    },
  ]);
  const [input, setInput] = useState("");

  const messagesRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessages((prev) => [...prev, { role: "user", content: input }]);

    const { data } = await search({ query: input, limit: 10 });
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: data?.results.length
          ? "Here are some relevant files I found."
          : "You can ask me about them.",
        results: data?.results,
      },
    ]);

    setInput("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isLoading || !input) return;
      onSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleActionClick = async (action: string, messageIndex: number) => {
    console.log("Action clicked:", action, "Message index:", messageIndex);
    // if (action === "Refresh") {
    //   setIsGenerating(true);
    //   try {
    //     await reload();
    //   } catch (error) {
    //     console.error("Error reloading:", error);
    //   } finally {
    //     setIsGenerating(false);
    //   }
    // }
    if (action === "Copy") {
      const message = messages[messageIndex];
      if (message && message.role === "assistant") {
        navigator.clipboard.writeText(message.content);
      }
    }
  };

  return (
    <main className='flex flex-1 w-full flex-col items-center mx-auto h-full overflow-hidden'>
      <div className='flex-1 w-full overflow-y-auto py-6' ref={messagesRef}>
        <ChatMessageList>
          {/* Messages */}
          {messages.map((message, index) => (
            <div key={index}>
              <ChatBubble
                variant={message.role == "user" ? "sent" : "received"}
              >
                <ChatBubbleAvatar
                  src=''
                  fallback={message.role == "user" ? "👨🏽" : "🤖"}
                />
                <ChatBubbleMessage>
                  <Markdown key={index} remarkPlugins={[remarkGfm]}>
                    {message.content}
                  </Markdown>
                  {message.role === "assistant" &&
                    messages.length - 1 === index && (
                      <div className='flex items-center mt-1.5 gap-1'>
                        {!isLoading && (
                          <>
                            {ChatAiIcons.map((icon, iconIndex) => {
                              const Icon = icon.icon;
                              return (
                                <ChatBubbleAction
                                  variant='outline'
                                  className='size-5'
                                  key={iconIndex}
                                  icon={<Icon className='size-3' />}
                                  onClick={() =>
                                    handleActionClick(icon.label, index)
                                  }
                                />
                              );
                            })}
                          </>
                        )}
                      </div>
                    )}
                </ChatBubbleMessage>
              </ChatBubble>
              {message.results && message.results.length > 0 && (
                <div className='mt-2 ml-10 flex overflow-x-auto pb-4'>
                  {message.results.slice(0, 3).map((file, idx) => (
                    <FileCard
                      key={`${file.metadata.source}-${idx}`}
                      file={file}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Loading */}
          {isLoading && (
            <ChatBubble variant='received'>
              <ChatBubbleAvatar src='' fallback='🤖' />
              <ChatBubbleMessage isLoading />
            </ChatBubble>
          )}
        </ChatMessageList>
      </div>

      {/* Form and Footer fixed at the bottom */}
      <div className='w-full px-4 pb-4 sticky bottom-0 bg-background'>
        <form
          ref={formRef}
          onSubmit={onSubmit}
          className='relative rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring'
        >
          <ChatInput
            value={input}
            onKeyDown={onKeyDown}
            onChange={handleInputChange}
            placeholder='Type your message here...'
            className='rounded-lg bg-background border-0 shadow-none focus-visible:ring-0'
          />
          <div className='flex items-center p-3 pt-0'>
            {/* <Button variant='ghost' size='icon'>
              <Paperclip className='size-4' />
              <span className='sr-only'>Attach file</span>
            </Button> */}

            {/* <Button variant='ghost' size='icon'>
              <Mic className='size-4' />
              <span className='sr-only'>Use Microphone</span>
            </Button> */}

            <button
              onClick={(e) => {
                e.preventDefault();
                onUpload();
              }}
              className='p-2 hover:bg-gray-100 rounded-full transition-colors'
            >
              <Upload className='w-5 h-5 text-gray-500' />
            </button>

            <Button
              disabled={!input || isLoading}
              type='submit'
              size='sm'
              className='ml-auto gap-1.5'
            >
              Send Message
              <CornerDownLeft className='size-3.5' />
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default Messenger;
