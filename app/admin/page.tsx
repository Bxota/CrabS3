"use client"

import { useEffect, useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFile, faEnvelope, faUser, faHdd, faDownload, faClock, faTrash, faShieldAlt, faShare } from "@fortawesome/free-solid-svg-icons"
import { Menu } from "@/components"

interface User {
  id: string
  email: string
  name: string | null
  isAdmin: boolean
  createdAt: string
  totalSize: number
  activeFiles: number
  totalFiles: number
  totalDownloads: number
  lastUploadAt: string | null
  expiredStorageSize: number
  status: "active" | "pending"
}

const Admin = () => {
  const [user, setUser] = useState<{ id: string; email: string, name: string, isAdmin: boolean } | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [emailInvite, setEmailInvite] = useState<string>("")

  useEffect(() => {
    const fetchUsersDash = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/admin/users')
        if (res.ok) {
          const data = await res.json()
          setUsers(data)
        }
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        setLoading(false)
      }
    }

    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (!data.isAdmin) {
            globalThis.location.href = "/"
            return
          }
          setUser(data)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Failed to fetch user:", error)
        setUser(null)
      }
    }

    fetchUser()
    fetchUsersDash()
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' })
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
    <main className="flex flex-col w-full max-w-7xl items-center px-4 sm:px-16 pt-10 mx-auto">
      <Menu user={user} />

      <div className="w-full mb-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-zinc-700 dark:text-zinc-300 mb-2">Admin Panel</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Manage users and storage</p>
      </div>

      {user?.isAdmin && (
        <div className="lg:w-150 w-full mb-8 flex flex-col border-zinc-200 dark:border-zinc-700 border-2 rounded-2xl p-6 bg-white shadow-zinc-100 shadow dark:shadow-zinc-600 dark:bg-zinc-900 transition duration-300">
          <h2 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-4">Admin Panel</h2>
          <p className="text-zinc-600 dark:text-zinc-400 mb-2">You have admin privileges. You can invite new users by email</p>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex flex-col w-full gap-1">
              <label htmlFor="emailInvite" className="text-zinc-700 dark:text-zinc-300">Email</label>
              <div className='inputClass h-10 text-lg bg-[#fafafa] dark:bg-[#1c1d21] hover:bg-[#f4f4f6] dark:hover:bg-[#25272c] border-[#e9ebed]! dark:border-[#383a42]! rounded-md px-2 text-zinc-700! dark:text-[#d2d5da]! transition duration-300'>
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

      <div className="w-full flex flex-col border-zinc-200 dark:border-zinc-700 border-2 rounded-2xl p-6 bg-white shadow-zinc-100 shadow dark:shadow-zinc-600 dark:bg-zinc-900 transition duration-300">
        <h2 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-4">Users</h2>

        {!loading && users.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700 w-full">
                  <th className="text-left px-2 sm:px-4 py-2 font-semibold text-zinc-700 dark:text-zinc-300">
                    <FontAwesomeIcon icon={faEnvelope} className="mr-1 text-zinc-500 dark:text-zinc-400 hidden sm:inline" />
                    Email</th>
                  <th className="text-left px-2 sm:px-4 py-2 font-semibold text-zinc-700 dark:text-zinc-300">
                    <FontAwesomeIcon icon={faUser} className="mr-1 text-zinc-500 dark:text-zinc-400 hidden sm:inline" />
                    Name</th>
                  <th className="text-left px-2 sm:px-4 py-2 font-semibold text-zinc-700 dark:text-zinc-300">
                    <FontAwesomeIcon icon={faShieldAlt} className="mr-1 text-zinc-500 dark:text-zinc-400 hidden sm:inline" />
                    Status</th>
                  <th className="text-left px-2 sm:px-4 py-2 font-semibold text-zinc-700 dark:text-zinc-300">
                    <FontAwesomeIcon icon={faClock} className="mr-1 text-zinc-500 dark:text-zinc-400 hidden sm:inline" />
                    Created</th>
                  <th className="text-left px-2 sm:px-4 py-2 font-semibold text-zinc-700 dark:text-zinc-300">
                    <FontAwesomeIcon icon={faHdd} className="mr-1 text-zinc-500 dark:text-zinc-400 hidden sm:inline" />
                    Storage</th>
                  <th className="text-left px-2 sm:px-4 py-2 font-semibold text-zinc-700 dark:text-zinc-300">
                    <FontAwesomeIcon icon={faTrash} className="mr-1 text-zinc-500 dark:text-zinc-400 hidden sm:inline" />
                    Expired</th>
                  <th className="text-left px-2 sm:px-4 py-2 font-semibold text-zinc-700 dark:text-zinc-300">
                    <FontAwesomeIcon icon={faDownload} className="mr-1 text-zinc-500 dark:text-zinc-400 hidden sm:inline" />
                    Downloads</th>
                  <th className="text-left px-2 sm:px-4 py-2 font-semibold text-zinc-700 dark:text-zinc-300">
                    <FontAwesomeIcon icon={faFile} className="mr-1 text-zinc-500 dark:text-zinc-400 hidden sm:inline" />
                    Files</th>
                  <th className="text-left px-2 sm:px-4 py-2 font-semibold text-zinc-700 dark:text-zinc-300">
                    <FontAwesomeIcon icon={faClock} className="mr-1 text-zinc-500 dark:text-zinc-400 hidden sm:inline" />
                    Last Upload</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr key={u.id} className={`border-b border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-950 transition duration-200 ${index % 2 === 0 ? 'bg-zinc-50 dark:bg-zinc-800' : 'bg-white dark:bg-zinc-900'}`}>
                    <td className="px-2 sm:px-4 py-3 text-zinc-700 dark:text-zinc-200 text-xs sm:text-sm">{u.email}</td>
                    <td className="px-2 sm:px-4 py-3 text-zinc-700 dark:text-zinc-200 text-xs sm:text-sm">{u.name || '-'}</td>
                    <td className="px-2 sm:px-4 py-3">
                      {u.status === "pending" ? (
                        <span className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full text-xs font-semibold">
                          <FontAwesomeIcon icon={faClock} size="xs" />
                          Pending
                        </span>
                      ) : u.isAdmin ? (
                        <span className="inline-flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-full text-xs font-semibold">
                          <FontAwesomeIcon icon={faShieldAlt} size="xs" />
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs font-semibold">
                          User
                        </span>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-zinc-700 dark:text-zinc-200 text-xs sm:text-sm">{formatDate(u.createdAt)}</td>
                    <td className="px-2 sm:px-4 py-3 text-zinc-700 dark:text-zinc-200 font-semibold text-xs sm:text-sm">{formatBytes(u.totalSize)}</td>
                    <td className="px-2 sm:px-4 py-3 text-zinc-700 dark:text-zinc-200 text-xs sm:text-sm">{formatBytes(u.expiredStorageSize)}</td>
                    <td className="px-2 sm:px-4 py-3 text-zinc-700 dark:text-zinc-200 text-xs sm:text-sm">{u.totalDownloads}</td>
                    <td className="px-2 sm:px-4 py-3 text-zinc-700 dark:text-zinc-200 text-xs sm:text-sm">{u.activeFiles}/{u.totalFiles}</td>
                    <td className="px-2 sm:px-4 py-3 text-zinc-700 dark:text-zinc-200 text-xs sm:text-sm">{formatDate(u.lastUploadAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !loading ? (
          <p className="text-center text-zinc-500 dark:text-zinc-400">No users found</p>
        ) : (
          <p className="text-center text-zinc-500 dark:text-zinc-400">Loading...</p>
        )}
      </div>
    </main>
  )
}

export default Admin
