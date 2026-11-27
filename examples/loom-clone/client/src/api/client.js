// Every call to the backend goes through this file.
// Endpoints, field names and shapes follow docs/api-contract.md exactly.
import { useMemo } from 'react'
import { useSession } from '../auth/SessionProvider.jsx'
import { fileNameFor } from '../recorder/toMp4.js'

export const API_BASE_URL = 'http://localhost:3001'

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}

// The session provider registers a handler here so that any 401 on a
// signed-in call signs the user out (which redirects them to /login).
let onUnauthorized = () => {}
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler
}

async function request(path, { method = 'GET', token, json, form } = {}) {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  let body
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  } else if (form) {
    body = form // the browser sets the multipart Content-Type itself
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method, headers, body })
  } catch {
    throw new ApiError(0, 'network_error', "Can't reach the local server. Is it running on port 3001?")
  }

  if (response.status === 204) return null
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    if (response.status === 401 && token) onUnauthorized()
    throw new ApiError(
      response.status,
      data?.error || 'server_error',
      data?.message || 'Something went wrong.',
    )
  }
  return data
}

// Public auth calls
export const signup = (email, password) =>
  request('/auth/signup', { method: 'POST', json: { email, password } })

export const login = (email, password) =>
  request('/auth/login', { method: 'POST', json: { email, password } })

export const getMe = (token) => request('/auth/me', { token })

// The <video> element and download link cannot send a header, so the
// contract lets this one endpoint take the token in the query string.
export function recordingFileUrl(id, token, { download = false } = {}) {
  const url = `${API_BASE_URL}/recordings/${id}/file?token=${token}`
  return download ? `${url}&download=1` : url
}

// Returns the API functions bound to the current user's token.
export function useApi() {
  const { accessToken: token } = useSession()
  return useMemo(
    () => ({
      listRecordings: () => request('/recordings', { token }),
      getRecording: (id) => request(`/recordings/${id}`, { token }),
      renameRecording: (id, title) =>
        request(`/recordings/${id}`, { method: 'PUT', token, json: { title } }),
      deleteRecording: (id) => request(`/recordings/${id}`, { method: 'DELETE', token }),
      createRecording: ({ blob, mode, durationSeconds }) => {
        const form = new FormData()
        // "recording.mp4", or "recording.webm" from a browser that cannot make MP4.
        form.append('file', blob, fileNameFor(blob))
        form.append('mode', mode)
        form.append('duration_seconds', String(durationSeconds))
        // No title: the server sets the default "Recording — <date>" title.
        return request('/recordings', { method: 'POST', token, form })
      },
      fileUrl: (id) => recordingFileUrl(id, token),
      downloadUrl: (id) => recordingFileUrl(id, token, { download: true }),
    }),
    [token],
  )
}
