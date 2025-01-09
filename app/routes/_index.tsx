import { useEffect, useState } from "react";
import type { MetaFunction } from "@remix-run/node";

// Import required CSS

import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";
import Uppy from "@uppy/core";
import GoogleDrivePicker from "@uppy/google-drive-picker";
import { DashboardModal } from "@uppy/react";

import {
  useGetDocumentJobQuery,
  useProcessDocumentMutation,
} from "~/store/api";
import Messenger from "~/components/messenger";
import GmailPicker from "~/lib/gmail-picker/GmailPicker";
import GCS from "~/lib/gcs";
import { VerticalNav } from "~/components/ui/nav/vertical-nav";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Data sources for LLM" },
    { name: "description", content: "Upload documents from Google Drive" },
  ];
};

type JobStatus = "idle" | "processing" | "success" | "error";

export async function loader() {
  return {
    gcloudOauthClientId: process.env.GCLOUD_OAUTH_CLIENT_ID,
    googleDriveApiKey: process.env.GOOGLE_DRIVE_API_KEY,
    gmailApiKey: process.env.GMAIL_API_KEY,
    googleProjectId: process.env.GOOGLE_PROJECT_ID,
    companionUrl: process.env.COMPANION_URL,
  };
}

export default function Index() {
  const {
    gmailApiKey,
    gcloudOauthClientId,
    googleDriveApiKey,
    googleProjectId,
    companionUrl,
  } = useLoaderData<typeof loader>();
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [dashboardModalOpen, setDashboardModalOpen] = useState(false);

  const [processDocument, { data: job, isLoading: isProcessDocumentLoading }] =
    useProcessDocumentMutation();

  const { data: lastJob, isLoading: isLastJobLoading } = useGetDocumentJobQuery(
    job?.job_id as string,
    {
      skip: !job?.job_id || jobStatus !== "processing",
      pollingInterval: 1500,
    }
  );

  const [uppy] = useState(() =>
    new Uppy()
      .use(GoogleDrivePicker, {
        clientId: gcloudOauthClientId as string,
        apiKey: googleDriveApiKey as string,
        appId: googleProjectId as string,
        companionUrl: companionUrl as string,
        companionAllowedHosts: companionUrl as string,
        companionCookiesRule: "include",
      })
      .use(GmailPicker, {
        clientId: gcloudOauthClientId as string,
        apiKey: gmailApiKey as string,
        appId: googleProjectId as string,
        companionUrl: companionUrl as string,
        companionAllowedHosts: companionUrl as string,
        companionCookiesRule: "include",
      })
      .use(GCS, {
        endpoint: "http://localhost:3020",
      })
  );

  uppy.on("upload-success", async (file, response) => {
    try {
      let filename = response.uploadURL?.split("/").pop();
      await processDocument({
        bucket: "spacestation-labs-companion",
        key: filename as string,
      });
    } catch (error) {
      console.error(error);
    }
  });

  useEffect(() => {
    if (jobStatus === "idle") {
      setJobStatus((job?.status as JobStatus) || "idle");
    } else if (jobStatus !== lastJob?.status) {
      setJobStatus((lastJob?.status as JobStatus) || "idle");
    }
  }, [job?.status, lastJob?.status]);

  return (
    <>
      <div className='h-screen overflow-hidden bg-gray-50'>
        <div className='h-full max-w-6xl mx-auto p-4'>
          <div className='bg-white rounded-lg shadow-lg h-[calc(100%-2rem)] flex'>
            <VerticalNav />
            <div className='flex-1 flex flex-col'>
              <div className='p-4 border-b flex-shrink-0'>
                <h1 className='text-xl font-semibold'>File Search Assistant</h1>
              </div>
              <Messenger onUpload={() => setDashboardModalOpen(true)} />
            </div>
          </div>
        </div>
      </div>
      <DashboardModal
        uppy={uppy}
        open={dashboardModalOpen}
        onRequestClose={() => setDashboardModalOpen(false)}
        plugins={["GoogleDrivePicker", "GmailPicker"]}
        className='w-[750px]'
        proudlyDisplayPoweredByUppy={false}
      />
    </>
  );
}
