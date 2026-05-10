"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faShare } from "@fortawesome/free-solid-svg-icons"

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState<{
    files: Array<{
      id: string;
      filename: string;
      content_type: string;
      size: number;
      uploaded_at: string;
      expires_at: string;
      download_count: number;
      max_downloads: number | null;
      password_hash: string | null;
      folder_id: string | null;
      email_sender: string | null;
      email_recipient: string | null;
    }>,
    isAdmin: boolean;
  } | null>(null)
  const [emailInvite, setEmailInvite] = useState<string>("")

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard/files')
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const data = await response.json()
        setDashboardData(data)
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      }
    }

    fetchDashboardData()
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const sendInvite = async () => {
    if (!emailInvite) return
    try {
      const response = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailInvite }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send invite')
      }
      alert('Invitation sent successfully!')
      setEmailInvite("")
    } catch (error: any) {
      console.error('Error sending invite:', error)
      alert(`Error: ${error.message}`)
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center min-h-screen bg-white dark:bg-black">
      <main className="flex flex-col w-full max-w-7xl items-center px-4 sm:px-16 py-10">
        <div className="w-full mb-8 flex flex-col items-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-3xl font-bold text-zinc-700 dark:text-zinc-300">Dashboard</h1>
            <Link href="/" className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 font-semibold">
              Back to Upload
            </Link>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400">Manage your uploaded files</p>
        </div>

        {dashboardData?.isAdmin && (
          <div className="lg:w-150 w-full mb-8 flex flex-col border-zinc-200 dark:border-zinc-700 border-2 rounded-2xl p-6 bg-yellow-50 shadow-zinc-100 shadow dark:shadow-zinc-600 dark:bg-zinc-900 transition duration-300">
            <h2 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-4">Admin Panel</h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-2">You have admin privileges. You can invite new users by email</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col w-full gap-1">
                <label htmlFor="emailInvite" className="text-zinc-700 dark:text-zinc-300">Email</label>
                <div className='inputClass h-8 text-lg bg-[#fafafa] dark:bg-[#1c1d21] hover:bg-[#f4f4f6] dark:hover:bg-[#25272c] border-[#e9ebed]! dark:border-[#383a42]! rounded-md px-2 text-zinc-700! dark:text-[#d2d5da]! transition duration-300'>
                  <FontAwesomeIcon icon={faShare} className='text-zinc-700 dark:text-[#d2d5da]' size='2xs' />
                  <input
                    type="email"
                    id="emailInvite"
                    name="emailInvite"
                    placeholder='Enter email to invite user'
                    className="outline-none w-full"
                    value={emailInvite}
                    onChange={(e) => setEmailInvite(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={sendInvite}
                disabled={!emailInvite}
                className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Send Invite
              </button>
            </div>
          </div>
        )}

        {(dashboardData && dashboardData.files.length > 0) ? (
          <div className="lg:w-150 w-full flex flex-col border-zinc-200 dark:border-zinc-700 border-2 rounded-2xl p-6 bg-white shadow-zinc-100 shadow dark:shadow-zinc-600 dark:bg-zinc-900 transition duration-300">
            <h2 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-4">Your Files ({dashboardData.files.length})</h2>
            <div className='space-y-3'>
              {dashboardData.files.map(file => (
                <div key={file.id} className='flex flex-col gap-3 bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 transition'>
                  <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3'>
                    <div className='flex-1 min-w-0'>
                      <p className='text-lg font-semibold text-zinc-700 dark:text-zinc-300 wrap-break-word'>{file.filename}</p>
                      <p className='text-sm text-zinc-500 dark:text-zinc-400 mt-1'>{formatBytes(file.size)}</p>
                    </div>
                  </div>

                  <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm'>
                    <div className='flex flex-col'>
                      <span className='text-zinc-500 dark:text-zinc-400 font-semibold'>Uploaded</span>
                      <span className='text-zinc-700 dark:text-zinc-300'>{new Date(file.uploaded_at).toLocaleDateString()}</span>
                      <span className='text-zinc-600 dark:text-zinc-400 text-xs'>{new Date(file.uploaded_at).toLocaleTimeString()}</span>
                    </div>

                    <div className='flex flex-col'>
                      <span className='text-zinc-500 dark:text-zinc-400 font-semibold'>Expires</span>
                      <span className='text-zinc-700 dark:text-zinc-300'>{new Date(file.expires_at).toLocaleDateString()}</span>
                      <span className='text-zinc-600 dark:text-zinc-400 text-xs'>{new Date(file.expires_at).toLocaleTimeString()}</span>
                    </div>

                    <div className='flex flex-col'>
                      <span className='text-zinc-500 dark:text-zinc-400 font-semibold'>Downloads</span>
                      <span className='text-zinc-700 dark:text-zinc-300'>{file.download_count} {file.max_downloads ? `/ ${file.max_downloads}` : '/ Unlimited'}</span>
                    </div>

                    <div className='flex flex-col'>
                      <span className='text-zinc-500 dark:text-zinc-400 font-semibold'>Protection</span>
                      <span className='text-zinc-700 dark:text-zinc-300'>{file.password_hash ? '🔒 Password' : '🔓 No password'}</span>
                    </div>
                  </div>

                  {(file.email_sender || file.email_recipient) && (
                    <div className='border-t border-zinc-200 dark:border-zinc-700 pt-3 text-sm'>
                      {file.email_sender && (
                        <p className='text-zinc-600 dark:text-zinc-400'><span className='font-semibold select-none mr-2'>Notify:</span>{file.email_sender}</p>
                      )}
                      {file.email_recipient && (
                        <p className='text-zinc-600 dark:text-zinc-400'><span className='font-semibold select-none mr-2'>Recipient:</span>{file.email_recipient}</p>
                      )}
                    </div>
                  )}

                  <div className='flex gap-2 pt-2 flex-wrap'>
                    <button
                      onClick={() => {
                        const link = `${globalThis.location.origin}/file/${file.folder_id}`
                        navigator.clipboard.writeText(link).catch(() => {
                          const textarea = document.createElement('textarea')
                          textarea.value = link
                          textarea.style.cssText = 'position:fixed;opacity:0'
                          document.body.appendChild(textarea)
                          textarea.select()
                          document.execCommand('copy')
                          document.body.removeChild(textarea)
                        })
                      }}
                      className='bg-blue-500 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition'
                    >
                      Copy Link
                    </button>
                    <Link
                      href={`/file/${file.folder_id}`}
                      target="_blank"
                      className='bg-zinc-500 hover:bg-zinc-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition'
                    >
                      Download
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : dashboardData ? (
          <div className="lg:w-150 w-full flex flex-col border-zinc-200 dark:border-zinc-700 border-2 rounded-2xl p-12 bg-white shadow-zinc-100 shadow dark:shadow-zinc-600 dark:bg-zinc-900 transition duration-300 text-center">
            <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">You have not uploaded any files yet.</p>
            <Link href="/" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition w-fit mx-auto">
              Start Uploading
            </Link>
          </div>
        ) : (
          <div className="lg:w-150 w-full flex flex-col border-zinc-200 dark:border-zinc-700 border-2 rounded-2xl p-6 bg-white shadow-zinc-100 shadow dark:shadow-zinc-600 dark:bg-zinc-900 transition duration-300">
            <p className="text-lg text-zinc-600 dark:text-zinc-400 text-center">Loading your files...</p>
          </div>
        )}

        <div className='mt-12 mb-4 text-center text-zinc-500 dark:text-zinc-400 z-0'>
          <h1 className="text-xl font-bold">CrabS3</h1>
          <p className="text-sm">No cloud. No bill. Just S3 buckets full of crabs. 🦀</p>
        </div>
      </main>
    </div>
  )
}

export default DashboardPage
