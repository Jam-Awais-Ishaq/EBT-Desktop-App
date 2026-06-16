const path = require('path')

/** Shell / helper processes — not counted as user app time. */
const IGNORED_PROCESS_NAMES = new Set([
  'powershell',
  'pwsh',
  'cmd',
  'conhost',
  'openconsole',
  'windowsterminal',
  'dwm',
  'csrss',
  'svchost',
  'runtimebroker',
  'searchhost',
  'shellexperiencehost',
  'systemsettings',
  'lockapp',
  'textinputhost',
  'securityhealthsystray',
])

const EXE_PATH_LABELS = [
  [/\\Google\\Chrome\\Application\\chrome\.exe$/i, 'Chrome'],
  [/\\Microsoft\\Edge\\Application\\msedge\.exe$/i, 'Microsoft Edge'],
  [/\\Mozilla Firefox\\firefox\.exe$/i, 'Firefox'],
  [/\\Microsoft VS Code\\Code\.exe$/i, 'VS Code'],
  [/\\Cursor\\Cursor\.exe$/i, 'Cursor'],
  [/\\Teams\.exe$/i, 'Microsoft Teams'],
  [/\\slack\\slack\.exe$/i, 'Slack'],
  [/\\Discord\\Discord\.exe$/i, 'Discord'],
  [/\\Spotify\\Spotify\.exe$/i, 'Spotify'],
  [/\\WINWORD\.EXE$/i, 'Microsoft Word'],
  [/\\EXCEL\.EXE$/i, 'Microsoft Excel'],
  [/\\POWERPNT\.EXE$/i, 'Microsoft PowerPoint'],
  [/\\OUTLOOK\.EXE$/i, 'Microsoft Outlook'],
  [/\\Figma\.exe$/i, 'Figma'],
  [/\\Postman\.exe$/i, 'Postman'],
  [/\\notepad\+\+\.exe$/i, 'Notepad++'],
]

const PROCESS_NAME_MAP = {
  Code: 'VS Code',
  Cursor: 'Cursor',
  chrome: 'Chrome',
  msedge: 'Microsoft Edge',
  firefox: 'Firefox',
  WINWORD: 'Microsoft Word',
  EXCEL: 'Microsoft Excel',
  POWERPNT: 'Microsoft PowerPoint',
  OUTLOOK: 'Microsoft Outlook',
  Teams: 'Microsoft Teams',
  slack: 'Slack',
  Discord: 'Discord',
  Spotify: 'Spotify',
  electron: 'Elevate Bright Tec',
  node: 'Node.js',
}

let winApi = null

function loadWinApi() {
  if (winApi !== null) return winApi
  if (process.platform !== 'win32') {
    winApi = false
    return winApi
  }

  try {
    const koffi = require('koffi')
    const user32 = koffi.load('user32.dll')
    const kernel32 = koffi.load('kernel32.dll')

    winApi = {
      GetForegroundWindow: user32.func('void * __stdcall GetForegroundWindow()'),
      GetWindowThreadProcessId: user32.func(
        'uint32 __stdcall GetWindowThreadProcessId(void * hWnd, _Out_ uint32 * lpdwProcessId)',
      ),
      OpenProcess: kernel32.func(
        'void * __stdcall OpenProcess(uint32 dwDesiredAccess, int bInheritHandle, uint32 dwProcessId)',
      ),
      CloseHandle: kernel32.func('int __stdcall CloseHandle(void * hObject)'),
      QueryFullProcessImageNameW: kernel32.func(
        'bool __stdcall QueryFullProcessImageNameW(void * hProcess, uint32 dwFlags, uint16 * lpExeName, _Inout_ uint32 * lpdwSize)',
      ),
    }
  } catch (err) {
    console.warn('[app-usage] Windows API init failed:', err.message)
    winApi = false
  }

  return winApi
}

function toFriendlyProcessName(processName) {
  const raw = String(processName || '').trim()
  if (!raw) return 'Unknown'
  if (PROCESS_NAME_MAP[raw]) return PROCESS_NAME_MAP[raw]
  const lower = raw.toLowerCase()
  for (const [key, label] of Object.entries(PROCESS_NAME_MAP)) {
    if (key.toLowerCase() === lower) return label
  }
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function friendlyNameFromExePath(exePath) {
  const normalized = String(exePath || '').trim()
  if (!normalized) return null

  for (const [pattern, label] of EXE_PATH_LABELS) {
    if (pattern.test(normalized)) return label
  }

  const base = path.basename(normalized).replace(/\.exe$/i, '')
  if (!base || IGNORED_PROCESS_NAMES.has(base.toLowerCase())) return null
  return toFriendlyProcessName(base)
}

/** Returns friendly app label for the current foreground window (Windows only). */
function getForegroundAppNameSync() {
  const api = loadWinApi()
  if (!api) return null

  try {
    const hwnd = api.GetForegroundWindow()
    if (!hwnd) return null

    const pidBuf = Buffer.alloc(4)
    api.GetWindowThreadProcessId(hwnd, pidBuf)
    const pid = pidBuf.readUInt32LE(0)
    if (!pid) return null

    const PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
    const hProcess = api.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid)
    if (!hProcess) return null

    try {
      const sizeBuf = Buffer.alloc(4)
      sizeBuf.writeUInt32LE(260, 0)
      const nameBuf = Buffer.alloc(520)
      const ok = api.QueryFullProcessImageNameW(hProcess, 0, nameBuf, sizeBuf)
      if (!ok) return null

      const charCount = sizeBuf.readUInt32LE(0)
      const exePath = nameBuf.toString('utf16le', 0, charCount * 2).replace(/\0/g, '')
      return friendlyNameFromExePath(exePath)
    } finally {
      api.CloseHandle(hProcess)
    }
  } catch (err) {
    console.warn('[app-usage] foreground read failed:', err.message)
    return null
  }
}

function isForegroundDetectionSupported() {
  return process.platform === 'win32' && loadWinApi() !== false
}

module.exports = {
  getForegroundAppNameSync,
  friendlyNameFromExePath,
  isForegroundDetectionSupported,
  toFriendlyProcessName,
}
