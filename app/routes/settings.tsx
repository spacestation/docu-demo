import { VerticalNav } from "~/components/ui/nav/vertical-nav";
import { Link } from "@remix-run/react";

function Settings() {
  return (
    <div className='h-screen overflow-hidden bg-gray-50'>
      <div className='h-full max-w-6xl mx-auto p-4'>
        <div className='bg-white rounded-lg shadow-lg h-[calc(100%-2rem)] flex'>
          <VerticalNav />
          <div className='flex-1 flex flex-col'>
            <div className='p-4 border-b flex-shrink-0'>
              <h1 className='text-xl font-semibold'>Settings</h1>
            </div>

            <div className='p-4 flex-1 overflow-y-auto'>
              <div className='space-y-4'>
                <div className='text-lg font-semibold'>
                  <a target='_blank' href='/privacy-policy.html'>
                    Privacy Policy
                  </a>
                </div>
                <div className='text-lg font-semibold'>
                  <a target='_blank' href='/terms-of-service.html'>
                    Terms of Service
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
