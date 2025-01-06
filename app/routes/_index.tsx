import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { useActionData, useFetcher } from "@remix-run/react";
import { Dashboard } from "@uppy/react";
import Uppy from "@uppy/core";
import GoogleDrive from "@uppy/google-drive";
import AwsS3 from "@uppy/aws-s3";
import { useProcessDocumentMutation } from "~/store/api";
// Import required CSS
import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";

export const meta: MetaFunction = () => {
  return [
    { title: "Data sources for LLM" },
    { name: "description", content: "Upload documents from Google Drive" },
  ];
};

// export async function action({ request }: ActionFunctionArgs) {
//   const body = await request.json();

//   if (body.type === "upload-success") {
//     try {
//       const response = await fetch(
//         "https://minerva.alexlazar.dev/api/v1/documents/process",
//         {
//           method: "POST",
//           body: JSON.stringify({
//             bucket: "spacestation-labs-companion",
//             key: body.fileName as string,
//             force_reload: true,
//           }),
//           headers: {
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       const result = await response.json();
//       return { lastUpload: result };
//     } catch (error) {
//       return { lastUpload: null, error };
//     }
//   }

//   return {};
// }

export default function Index() {
  const [processDocument, { data: lastUpload }] = useProcessDocumentMutation();
  const uppy = new Uppy()
    .use(GoogleDrive, {
      companionUrl: "http://localhost:3020",
      companionAllowedHosts: "http://localhost:3020",
      companionCookiesRule: "include",
    })
    .use(AwsS3, {
      endpoint: "http://localhost:3020",
    });

  uppy.on("upload-success", (file, response) => {
    const actualFilename = response.uploadURL?.split("/").pop();
    processDocument({
      bucket: "spacestation-labs-companion",
      key: actualFilename as string,
      force_reload: true,
    });
  });

  return (
    <div className='flex h-screen p-4'>
      <div className='flex flex-1 flex-col'>
        <div className='flex flex-col gap-8'>
          <h1 className='text-2xl font-bold text-gray-800 dark:text-gray-100'>
            Data sources for LLM
          </h1>
          <Dashboard
            uppy={uppy}
            plugins={["GoogleDrive"]}
            className='w-[750px]'
            proudlyDisplayPoweredByUppy={false}
          />
        </div>

        <div className='fixed bottom-0 left-0 right-0 bg-white p-4'>
          <h2>Last upload</h2>
          <pre>{JSON.stringify(lastUpload, null, 2)}</pre>
        </div>
      </div>
      <div className='flex flex-1 flex-col gap-8'>
        <h1 className='text-2xl font-bold text-gray-800 dark:text-gray-100'>
          Document Chat
        </h1>
      </div>
    </div>
  );
}
