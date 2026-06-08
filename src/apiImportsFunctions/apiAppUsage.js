import taskApi from '../ApiInspector/apiTask'

export async function syncAppUsage({ usageDate, entries }) {
  const response = await taskApi.post('/api/app-usage/sync', { usageDate, entries })
  return response.data
}

export async function getAppUsageSummary(date) {
  const response = await taskApi.get('/api/app-usage/summary', {
    params: date ? { date } : undefined,
  })
  return response.data
}
