"use client"

import { faCloudArrowDown, faKey } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function Id() {
  const params = useParams()
  const id = params.id as string
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isDownloading, setIsDownloading] = useState<boolean>(false)
  const [notif, setNotif] = useState<{ type: "success" | "error" | "info", message: string } | null>(null)
  const [password, setPassword] = useState<string>("")
  const [fileInfo, setFileInfo] = useState<{
    exists: boolean
    files: Array<{
      id: string
      hasPassword: boolean
      filename: string
      size: number
      maxDownloads: number | null
      downloadCount: number
    }>
  } | null>(null)

  const downloadFile = async (fileId?: string) => {
    setIsDownloading(true)
    setNotif(null)

    try {
      if (fileInfo?.files[0]?.hasPassword && password)
        setNotif({ type: "info", message: "Verifying password..." })

      const validationResponse = await fetch(`/api/download/${id}${fileId ? `?fileId=${fileId}` : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      })
      if (validationResponse.status !== 200) {
        if (validationResponse.status === 410)
          return globalThis.location.reload()
        if (validationResponse.status === 401 || validationResponse.status === 403)
          throw new Error("Incorrect password")

        const errorData = await validationResponse.json()
        throw new Error(`Error: ${validationResponse.status} ${errorData.error || validationResponse.statusText}`)
      }

      let count = 0
      const interval = setInterval(() => {
        count += 1
        const fileCount = fileId ? 1 : fileInfo?.files.length || 0
        setNotif({
          type: "info",
          message: `Downloading ${fileCount} file${fileCount > 1 ? "s" : ""}` + ".".repeat(count % 4)
        })
      }, 500)

      const triggerDownload = (fId: string, filename: string) => {
        const link = document.createElement('a')
        link.href = `/api/download/${id}/stream?password=${encodeURIComponent(password)}&fileId=${fId}`
        link.setAttribute('download', filename)
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      if (fileId) {
        const file = fileInfo?.files.find(f => f.id === fileId)
        if (file) {
          triggerDownload(fileId, file.filename)
        }
      } else {
        fileInfo?.files.forEach(file => {
          triggerDownload(file.id, file.filename)
        })
      }

      clearInterval(interval)
      setNotif({ type: "success", message: `File${(fileId && fileInfo?.files.length === 1) ? '' : 's'} downloaded successfully!` })
      setTimeout(() => setNotif(null), 3000)
    } catch (err) {
      console.error('Error downloading file:', err)
      setNotif({ type: "error", message: err instanceof Error ? err.message : "Failed to download file" })
      setTimeout(() => setNotif(null), 3000)
    } finally {
      setIsDownloading(false)
    }
  }

  useEffect(() => {
    const checkFile = async () => {
      try {
        const response = await fetch(`/api/checkfile?folderId=${id}`)
        if (response.status !== 200) {
          throw new Error(`Error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setFileInfo(data)
      } catch (err) {
        console.error('Error checking file:', err)
        setNotif({ type: "error", message: err instanceof Error ? err.message : "Failed to check file" })
        setTimeout(() => setNotif(null), 3000)
      } finally {
        setIsLoading(false)
      }
    }

    checkFile()
  }, [id, setFileInfo, setIsLoading])

  return (
    <main className="my-auto">
      <h1 className="text-2xl font-bold text-center">
        Download File
      </h1>

      {!fileInfo?.exists && !isLoading ? (
        <div className="mt-4 p-6 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl bg-zinc-50 dark:bg-zinc-900">
          <p className="text-center text-zinc-500 dark:text-zinc-400">File not found. It may have been deleted or the link is incorrect.</p>
        </div>
      ) : null}

      {fileInfo?.exists && (
        <div className="lg:w-150 w-full mt-4 flex flex-col border-zinc-200 dark:border-zinc-700 border-2 rounded-2xl p-6 bg-zinc-50 dark:bg-zinc-900 gap-4">
          <div className="flex flex-col items-start gap-2">
            {fileInfo.files.map((file) => (
              <div className="w-full flex gap-4 items-center justify-between" key={file.id}>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <FontAwesomeIcon size="2x" icon={faCloudArrowDown} className="text-blue-400" />
                </div>
                <div className="flex flex-col gap-1 w-full">
                  <span className="font-semibold truncate">{file.filename}</span>
                  <span className="text-xs">
                    <span>{(file.size > 1024 * 1024 * 1024) ? (file.size / (1024 * 1024 * 1024)).toFixed(2) + " GB" : (file.size > 1024 * 1024) ? (file.size / (1024 * 1024)).toFixed(2) + " MB" : (file.size / 1024).toFixed(2) + " KB"}</span>
                    {file.maxDownloads !== null &&
                      <span> | {file.downloadCount} / {file.maxDownloads} downloads</span>
                    }
                  </span>
                </div>

                {fileInfo.files.length > 1 && <div>
                  <button
                    onClick={() => downloadFile(file.id)}
                    disabled={isLoading || !fileInfo || (fileInfo.files.some((f) => f.hasPassword) && !password) || isDownloading}
                    className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition"
                  >
                    Download
                  </button>
                </div>}
              </div>
            ))}
            {fileInfo.files.some((f) => f.hasPassword) && (
              <div className="w-full flex flex-wrap items-center justify-between mt-2 gap-1">
                <label htmlFor="password" className="font-semibold">This file is password protected.</label>
                <div className='w-full inputClass h-10 text-lg bg-[#fafafa] dark:bg-[#1c1d21] hover:bg-[#f4f4f6] dark:hover:bg-[#25272c] border-[#e9ebed]! dark:border-[#383a42]! rounded-md px-2 text-zinc-700! dark:text-[#d2d5da]! transition duration-300'>
                  <FontAwesomeIcon icon={faKey} className='text-zinc-700 dark:text-[#d2d5da]' size='xs' />
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && downloadFile()}
                    className="outline-none w-full"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => downloadFile()}
            disabled={isLoading || !fileInfo || (fileInfo.files.some((f) => f.hasPassword) && !password) || isDownloading}
            className="bg-blue-500 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg cursor-pointer transition"
          >
            Download {fileInfo.files.length > 1 ? "Files" : "File"}
          </button>
          {notif && (
            <div className={`p-4 rounded-lg ${notif.type === "error" ? "bg-red-100 text-red-700" : notif.type === "success" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
              {notif.message}
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="mt-4 p-6 border-2 border-zinc-200 dark:border-zinc-700 rounded-2xl bg-zinc-50 dark:bg-zinc-900">
          <p className="text-zinc-500 dark:text-zinc-400">Loading file information...</p>
        </div>
      )}
    </main>
  )
}
