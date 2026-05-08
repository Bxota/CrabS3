"use client"

import { useMultipartUpload } from '@/hooks/useMultipartUpload'
import { faArrowsDownToLine, faAt, faClockRotateLeft, faEnvelope, faFileCode, faFileImage, faFileText, faKey, faPaperPlane, faPen } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useState, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'

export default function Home() {
  const [maxDownloads, setMaxDownloads] = useState<number | null>(null)
  const [notifyEmail, setNotifyEmail] = useState<string>("")
  const [emailRecipient, setEmailRecipient] = useState<string>("")
  const [emailMessage, setEmailMessage] = useState<string>("")
  const [expireAfter, setExpireAfter] = useState<"1" | "7" | "14" | "21" | "30">("30")
  const [password, setPassword] = useState<string>("")
  const [fileMeta, setFileMeta] = useState<{ name: string, size: number, img?: string }[]>([])
  const [editingFileIndex, setEditingFileIndex] = useState<number | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [folderId, setFolderId] = useState<string>("")
  const [status, setStatus] = useState<{
    message: string
    data?: string | null
    type: "success" | "error" | "info"
    fileId?: string
  } | null>(null)
  const uploadResultsRef = useRef<number>(0)

  const { upload, progress, uploading, reset } = useMultipartUpload();

  useEffect(() => {
    if (!uploading && uploadResultsRef.current > 0 && status?.type === 'info') {
      if (uploadResultsRef.current === files.length) {
        setStatus({
          message: `Successfully uploaded ${uploadResultsRef.current} file${uploadResultsRef.current > 1 ? 's' : ''}!`,
          type: "success",
          fileId: folderId,
          data: folderId ? folderId : undefined,
        })

        setFileMeta([])
        setFiles([])
        setFolderId("")
        setPassword("")
        setMaxDownloads(null)
        setNotifyEmail("")
        setEmailRecipient("")
        setEditingFileIndex(null)
        uploadResultsRef.current = 0
      } else if (uploadResultsRef.current > 0 && uploadResultsRef.current < files.length) {
        setStatus({
          message: `Successfully uploaded ${uploadResultsRef.current} of ${files.length} files`,
          type: "success",
          fileId: folderId,
          data: folderId ? folderId : undefined,
        })
        uploadResultsRef.current = 0
      } else {
        setStatus({ message: "Failed to upload files.", type: "error" })
        uploadResultsRef.current = 0
      }
    }
  }, [uploading, files.length, folderId, status?.type])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploading) return;

    if (!folderId) {
      setFolderId(crypto.randomUUID());
    }

    const newMeta = acceptedFiles.map(file => ({
      name: file.name,
      size: file.size,
      img: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined
    }))

    setFileMeta(prev => [...prev, ...newMeta])
    setFiles(prev => [...prev, ...acceptedFiles])
    setStatus(null)
  }, [uploading, folderId])

  const { getRootProps, getInputProps } = useDropzone({ onDrop })

  const uploadFile = async () => {
    if (files.length === 0 || fileMeta.length === 0) return

    setStatus({ message: `Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`, type: "info" })
    uploadResultsRef.current = 0

    try {
      const results = await Promise.all(files.map((file, index) =>
        upload(file, {
          maxDownloads: maxDownloads ?? null,
          emailSender: notifyEmail || undefined,
          emailRecipient: emailRecipient || undefined,
          expireAfter,
          password: password || undefined,
          filename: fileMeta[index].name,
          folderId,
          emailMessage: emailMessage || undefined,
        })
      ))

      const successfulUploads = results.filter((res): res is Exclude<typeof res, null> => res !== null);
      uploadResultsRef.current = successfulUploads.length
    } catch (error) {
      setStatus({ message: "An error occurred during upload.", type: "error" })
      uploadResultsRef.current = 0
      console.error("Upload error:", error)
    }
  }

  const removeFile = (index: number) => {
    setFileMeta(prev => prev.filter((_, i) => i !== index))
    setFiles(prev => prev.filter((_, i) => i !== index))
    if (fileMeta.length === 1) {
      setStatus(null)
    }
  }

  const copyLink = async () => {
    if (!status?.fileId) return
    const link = `${globalThis.location.origin}/file/${status.fileId}`
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(link)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = link
        textarea.style.cssText = 'position:fixed;opacity:0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setStatus(prev => prev ? { ...prev, message: "Download link copied to clipboard!" } : null)
    } catch {
      setStatus(prev => prev ? { ...prev, message: "Failed to copy link", type: 'error' } : null)
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-white dark:bg-black">
      <main className={`flex flex-col ${fileMeta.length > 0 ? 'pt-10 pb-2' : 'h-screen justify-center'} w-full max-w-7xl items-center px-16`}>
        {(status || uploading) && (
          <div className={`lg:w-150 w-full mb-5 ${fileMeta.length > 0 ? '' : 'mt-4'} p-4 flex flex-col rounded-xl ${status?.type === 'success' ? 'bg-green-100 text-green-700' : status?.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
            <div className="flex justify-between items-center">
              <p>{status?.message}</p>
              {uploading && <span className="text-sm font-semibold">{progress}%</span>}
            </div>
            {uploading && (
              <div className="mt-2 w-full">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
            {status?.data && <pre className='bg-gray-100 dark:bg-gray-800 p-2 rounded-lg mt-2 text-sm overflow-x-auto h-9 truncate'>{status.data}</pre>}
            {status?.fileId && !uploading && (
              <button
                onClick={() => copyLink()}
                className="mt-2 bg-blue-500 hover:bg-blue-700 text-white cursor-pointer font-bold py-2 px-4 rounded-lg transition"
              >
                Copy download link
              </button>
            )}
          </div>
        )}

        <div className={`lg:w-150 w-full ${fileMeta.length > 0 ? 'h-40 md:h-40 p-1 rounded-2xl' : 'h-[30vh] my-auto p-2 rounded-3xl'} flex items-center justify-center border-zinc-200 dark:border-zinc-700 border-2 cursor-pointer group hover:border-blue-500 bg-zinc-50 dark:bg-zinc-900 transition duration-300`}>
          <div className={`${fileMeta.length > 0 ? 'rounded-xl' : 'rounded-2xl'} w-full h-full flex items-center justify-center border-dashed border-zinc-200 dark:border-zinc-700 border-2 group-hover:border-blue-300 dark:group-hover:border-blue-800 transition duration-300`} {...getRootProps()}>
            <input {...getInputProps()} />
            <div className="p-8 text-xl text-center text-zinc-700 dark:text-zinc-300">
              {fileMeta.length > 0 ? <div>
                <div className='flex justify-center'>
                  <FontAwesomeIcon icon={faFileText} size='3x' className='-rotate-45 -mr-9 mt-3 text-zinc-400 dark:text-zinc-700' />
                  <FontAwesomeIcon icon={faFileImage} size='3x' className='z-100 text-zinc-600 dark:text-zinc-400' />
                  <FontAwesomeIcon icon={faFileCode} size='3x' className='rotate-45 -ml-9 mt-3 text-zinc-400 dark:text-zinc-700' />
                </div>
                <div className='flex flex-col justify-center mt-4'>
                  <p className='text-sm font-bold text-zinc-700 dark:text-zinc-300'>{fileMeta.length} file{fileMeta.length > 1 ? 's' : ''} selected</p>
                </div>
              </div> : <span className='w-3/5 flex m-auto'>Drag and drop some files here, or click to select files</span>}
            </div>
          </div>
        </div>

        {fileMeta.length > 0 && <div className="lg:w-150 w-full mt-5 flex flex-col border-zinc-200 dark:border-zinc-700 border-2 rounded-2xl p-6 bg-white shadow-zinc-100 shadow dark:shadow-zinc-600 dark:bg-zinc-900 transition duration-300">
          <h2 className="text-lg font-bold text-zinc-700 dark:text-zinc-300">Options</h2>

          <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-4 grid-rows-auto">
            <div className="flex flex-col gap-1 col-span-2">
              <label htmlFor="option1" className="text-zinc-700 dark:text-zinc-300">Max downloads</label>
              <div className='inputClass h-8 text-lg bg-[#fafafa] dark:bg-[#1c1d21] hover:bg-[#f4f4f6] dark:hover:bg-[#25272c] border-[#e9ebed]! dark:border-[#383a42]! rounded-md px-2 text-zinc-700! dark:text-[#d2d5da]! transition duration-300'>
                <FontAwesomeIcon icon={faArrowsDownToLine} className='text-zinc-700 dark:text-[#d2d5da]' size='2xs' />
                <input
                  type="number"
                  id="option1"
                  name="option1"
                  placeholder='e.g. 5'
                  className="outline-none"
                  value={maxDownloads ?? ''}
                  onChange={(e) => setMaxDownloads(e.target.value ? Number.parseInt(e.target.value) : null)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <label htmlFor="option1" className="text-zinc-700 dark:text-zinc-300">Expire after (days)</label>
              <div className='inputClass group h-8 text-lg bg-[#fafafa] dark:bg-[#1c1d21] hover:bg-[#f4f4f6] dark:hover:bg-[#25272c] border-[#e9ebed]! dark:border-[#383a42]! rounded-md px-2 text-zinc-700! dark:text-[#d2d5da]! transition duration-300'>
                <FontAwesomeIcon icon={faClockRotateLeft} className='text-zinc-700 dark:text-[#d2d5da] w-3' size='2xs' />
                <select
                  id="option1"
                  name="option1"
                  className="outline-none w-full bg-[#fafafa] dark:bg-[#1c1d21] text-zinc-700 group-hover:bg-[#f4f4f6] dark:group-hover:bg-[#25272c] dark:text-[#d2d5da] cursor-pointer transition duration-300"
                  value={expireAfter}
                  onChange={(e) => setExpireAfter(e.target.value as "1" | "7" | "14" | "21" | "30")}
                >
                  <option value="1">1 day</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="21">21 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col col-span-2 gap-1">
              <label htmlFor="emailSender" className="text-zinc-700 dark:text-zinc-300">Notify me by email</label>
              <div className='inputClass h-8 text-lg bg-[#fafafa] dark:bg-[#1c1d21] hover:bg-[#f4f4f6] dark:hover:bg-[#25272c] border-[#e9ebed]! dark:border-[#383a42]! rounded-md px-2 text-zinc-700! dark:text-[#d2d5da]! transition duration-300'>
                <FontAwesomeIcon icon={faAt} className='text-zinc-700 dark:text-[#d2d5da]' size='2xs' />
                <input
                  type="email"
                  id="emailSender"
                  name="emailSender"
                  autoComplete="off"
                  placeholder='my.email@example.com'
                  className="outline-none bg-transparent"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col col-span-2 gap-1">
              <label htmlFor="emailRecipient" className="text-zinc-700 dark:text-zinc-300">Email of recipient</label>
              <div className='inputClass h-8 text-lg bg-[#fafafa] dark:bg-[#1c1d21] hover:bg-[#f4f4f6] dark:hover:bg-[#25272c] border-[#e9ebed]! dark:border-[#383a42]! rounded-md px-2 text-zinc-700! dark:text-[#d2d5da]! transition duration-300'>
                <FontAwesomeIcon icon={faPaperPlane} className='text-zinc-700 dark:text-[#d2d5da]' size='2xs' />
                <input
                  type="email"
                  id="emailRecipient"
                  name="emailRecipient"
                  autoComplete="off"
                  placeholder='recipient@example.com'
                  className="outline-none"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                />
              </div>
            </div>

            {emailRecipient && <div className="flex flex-col col-span-4 gap-1">
              <label htmlFor="emailMessage" className="text-zinc-700 dark:text-zinc-300">Message to recipient</label>
              <div className='inputClass w-full! items-start! text-lg bg-[#fafafa] dark:bg-[#1c1d21] hover:bg-[#f4f4f6] dark:hover:bg-[#25272c] border-[#e9ebed]! dark:border-[#383a42]! rounded-md px-2 text-zinc-700! dark:text-[#d2d5da]! transition duration-300'>
                <FontAwesomeIcon icon={faEnvelope} className='text-zinc-700 dark:text-[#d2d5da] pt-2' size='2xs' />
                <textarea
                  id="emailMessage"
                  name="emailMessage"
                  placeholder='Optional message to recipient'
                  className="outline-none bg-transparent resize-none h-20 w-full"
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                />
              </div>
            </div>}

            <div className='col-span-4 flex flex-wrap justify-between border-t-2 border-zinc-300 dark:border-zinc-700 pt-4 mt-2'>
              <div className='flex flex-col w-full'>
                <h3 className="text-lg font-bold text-zinc-700 dark:text-zinc-300">Selected File{fileMeta.length > 1 ? 's' : ''} ({fileMeta.length})</h3>
                <div className='space-y-3 mt-3'>
                  {fileMeta.map((f, index) => (
                    <div key={index + f.name} className='flex gap-2 items-start bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg'>
                      <div className='flex-1'>
                        <div className='flex gap-2 items-center'>
                          {editingFileIndex === index ? (
                            <input
                              type="text"
                              autoFocus
                              className="h-8 text-lg outline-none bg-white dark:bg-zinc-700 rounded-md px-2 text-zinc-700 dark:text-zinc-300 transition duration-300 flex-1"
                              value={f.name.replace(/\.[^/.]+$/, "")}
                              onChange={(e) => setFileMeta(prev => {
                                const updated = [...prev]
                                updated[index] = { ...updated[index], name: e.target.value + f.name.slice(f.name.lastIndexOf('.')) }
                                return updated
                              })}
                              onBlur={() => setEditingFileIndex(null)}
                              onKeyDown={(e) => e.key === 'Enter' && setEditingFileIndex(null)}
                            />
                          ) : (
                            <>
                              <button onClick={() => setEditingFileIndex(index)} className="text-lg text-zinc-700 dark:text-zinc-300 cursor-pointer hover:text-blue-500 flex-1 text-left">{f.name}</button>
                              <FontAwesomeIcon icon={faPen} color='gray' className='text-sm cursor-pointer hover:text-blue-500' onClick={() => setEditingFileIndex(index)} />
                            </>
                          )}
                        </div>
                        <p className="text-zinc-500 dark:text-zinc-400 italic text-sm mt-1">{(f.size / 1024).toFixed(2)} KB</p>
                        <button
                          onClick={() => removeFile(index)}
                          className="border border-red-500 text-red-500 hover:text-red-700 dark:hover:text-zinc-50 text-sm px-2 py-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 cursor-pointer mt-2 transitions duration-200"
                        >
                          Remove
                        </button>
                      </div>
                      {f.img && (
                        <Link href={f.img} target="_blank">
                          <Image src={f.img} alt="Preview" className="rounded-md" width={80} height={80} />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col w-full gap-1 mt-4">
                <label htmlFor="password" className="text-zinc-700 dark:text-zinc-300">Password (optional)</label>
                <div className='inputClass h-8 text-lg bg-[#fafafa] dark:bg-[#1c1d21] hover:bg-[#f4f4f6] dark:hover:bg-[#25272c] border-[#e9ebed]! dark:border-[#383a42]! rounded-md px-2 text-zinc-700! dark:text-[#d2d5da]! transition duration-300'>
                  <FontAwesomeIcon icon={faKey} className='text-zinc-700 dark:text-[#d2d5da]' size='2xs' />
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder='Set a password to protect the file'
                    className="outline-none w-full"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className='w-full mt-4 flex gap-2'>
                <button
                  onClick={() => uploadFile()}
                  className={`flex-1 bg-blue-500 text-white font-semibold py-2 px-4 cursor-pointer rounded-lg transition ${uploading ? 'opacity-50 cursor-not-allowed!' : 'hover:bg-blue-700'}`}
                  disabled={uploading || files.length === 0}
                >
                  {uploading ? "Uploading..." : `Upload File${fileMeta.length > 1 ? 's' : ''}`}
                </button>
                <button
                  onClick={() => {
                    setFileMeta([])
                    setFiles([])
                    setFolderId("")
                    setStatus(null)
                  }}
                  className="bg-zinc-400 hover:bg-zinc-500 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  disabled={uploading || files.length === 0}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>}

        <div className='mt-6 mb-4 text-center text-zinc-500 dark:text-zinc-400 z-0'>
          <h1 className="text-xl font-bold">CrabS3</h1>
          <p className="text-sm">No cloud. No bill. Just S3 buckets full of crabs. 🦀</p>
        </div>
      </main>
    </div>
  );
}
