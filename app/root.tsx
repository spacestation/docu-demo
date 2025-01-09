import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import { Provider } from "react-redux";
import { store } from "./store";
import stylesheet from "~/tailwind.css?url";

export async function loader() {
  return json({
    ENV: {
      GOOGLE_DRIVE_CLIENT_ID: process.env.GOOGLE_DRIVE_CLIENT_ID,
      GOOGLE_DRIVE_API_KEY: process.env.GOOGLE_DRIVE_API_KEY,
      RAG_API_ENDPOINT: process.env.RAG_API_ENDPOINT,
    },
  });
}

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];

export default function App() {
  const data = useLoaderData<typeof loader>();

  return (
    <html lang='en'>
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Provider store={store}>
          <Outlet />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
            }}
          />
          <ScrollRestoration />
          <Scripts />
        </Provider>
      </body>
    </html>
  );
}
