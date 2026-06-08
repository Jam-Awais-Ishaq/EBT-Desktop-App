import api from "../ApiInspector/api";
import taskApi from "../ApiInspector/apiTask";

// authService.js or wherever loginUser is defined
export const loginUser = async (data) => {
  const response = await api.post("/api/auth/login", data, {
    withCredentials: true,
  });
  console.log("LOGIN RESPONSE:", response.data);

  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/api/profile/getProfile', {
    withCredentials: true,
  })
  return response.data
}

export const getTasks = async () => {
  const response = await taskApi.get("/api/getTasks");
  return response.data;
};


export const startTimer = async ({ projectId }) => {
  const response = await taskApi.post('/api/timer/start', {
    projectId,
  })
  return response.data
}

export const pauseTimer = async ({ sessionId }) => {
  try {
    const response = await taskApi.post('/api/timer/pause', { sessionId })
    return response.data
  } catch (err) {
    if (err?.response?.status !== 404) throw err
    const response = await taskApi.post('/api/timer/stop', {
      sessionId,
      pause: true,
    })
    return response.data
  }
}

export const getActiveTimer = async ({ projectId } = {}) => {
  const response = await taskApi.get('/api/timer/active', {
    params: projectId != null ? { projectId } : undefined,
  })
  return response.data
}

export const stopTimer = async ({
  sessionId,
  activityClickCount,
  activityKeypressCount,
  memo,
}) => {
  const response = await taskApi.post("/api/timer/stop", {
    sessionId,
    activityClickCount: activityClickCount ?? 0,
    activityKeypressCount: activityKeypressCount ?? 0,
    memo: memo != null ? String(memo) : '',
  })
  return response.data
}

/** Save work memo while the session is running. */
export const saveTimerMemo = async ({ sessionId, memo }) => {
  const response = await taskApi.post('/api/timer/memo', {
    sessionId,
    memo: memo != null ? String(memo) : '',
  })
  return response.data
}

/** Submit task for review (assignee only; requires submission_note). */
export const submitTask = async ({ taskId, submissionNote }) => {
  const response = await taskApi.post(`/api/tasks/${taskId}/submit`, {
    submission_note: submissionNote,
  })
  return response.data
}

export const getTimerHistory = async (projectId) => {
  const response = await taskApi.get(`/api/timer/history/${projectId}`)
  return response.data
}

export const getTimerRecord = async (sessionId) => {
  const response = await taskApi.get(`/api/timer/record/${sessionId}`)
  return response.data
}

/** Multipart: sessionId + PNG file. Timer must be running (backend checks session). */
export const postTimerScreenshot = async ({ sessionId, file }) => {
  const fd = new FormData()
  fd.append('sessionId', String(sessionId))
  fd.append('file', file, 'work.png')
  const response = await taskApi.post('/api/timer/screenshots', fd)
  return response.data
}

/** List saved screenshots for a session (`data` = rows with storage_path). */
export const getTimerScreenshots = async (sessionId) => {
  const response = await taskApi.get(`/api/timer/screenshots/session/${sessionId}`)
  return response.data
}