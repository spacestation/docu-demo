import { VerticalNav } from "~/components/ui/nav/vertical-nav";
import { useGetDocumentStatsQuery } from "~/store/api";
import { FileIcon } from "lucide-react";
import { useLoaderData } from "@remix-run/react";

export async function loader() {
  return {
    GCS_ENDPOINT: process.env.GCS_ENDPOINT,
  };
}

function DocumentCard({
  document,
}: {
  document: { source: string; embedded_at: string };
}) {
  const { GCS_ENDPOINT } = useLoaderData<typeof loader>();
  const filename = document.source.split("/").pop();
  const cleanFilename = filename
    ? decodeURIComponent(
        filename.replace(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/,
          ""
        )
      )
    : "";

  return (
    <a
      href={`${GCS_ENDPOINT}/${document.source}`}
      target='_blank'
      rel='noopener noreferrer'
      className='block w-full p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow'
    >
      <div className='flex items-center mb-2'>
        <FileIcon className='w-5 h-5 mr-2 text-blue-500' />
        <h3 className='font-medium truncate'>{cleanFilename}</h3>
      </div>
      <div className='text-sm text-gray-500'>
        <span>{new Date(document.embedded_at).toLocaleDateString()}</span>
      </div>
    </a>
  );
}

export default function Files() {
  const { data: documents, isLoading } = useGetDocumentStatsQuery();

  return (
    <div className='h-screen overflow-hidden bg-gray-50'>
      <div className='h-full max-w-6xl mx-auto p-4'>
        <div className='bg-white rounded-lg shadow-lg h-[calc(100%-2rem)] flex'>
          <VerticalNav />
          <div className='flex-1 flex flex-col'>
            <div className='p-4 border-b flex-shrink-0'>
              <h1 className='text-xl font-semibold'>Files</h1>
            </div>
            <div className='p-4 space-y-4 flex-1 overflow-y-auto'>
              {isLoading ? (
                <div className='text-center py-4'>Loading documents...</div>
              ) : documents?.length ? (
                <div className='space-y-4'>
                  {[...documents]
                    .sort(
                      (a, b) =>
                        new Date(b.embedded_at).getTime() -
                        new Date(a.embedded_at).getTime()
                    )
                    .map((document) => (
                      <DocumentCard
                        key={document.document_id}
                        document={document}
                      />
                    ))}
                </div>
              ) : (
                <div className='text-center py-4 text-gray-500'>
                  No documents found
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
