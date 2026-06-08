import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import { memo, useEffect, useState } from 'react'

/**
 * Inline work memo — local draft for instant typing; Redux/DB sync on blur via onCommit.
 */
function ProjectWorkMemo({
  timerRunning,
  value,
  onDraftSync,
  onCommit,
  saving = false,
  submitted = false,
  submitting = false,
  onSubmit,
}) {
  const [draft, setDraft] = useState(value ?? '')
  const hasMemo = Boolean(String(draft).trim())

  useEffect(() => {
    setDraft(value ?? '')
  }, [value])

  return (
    <Box sx={{ py: 2 }}>
      <TextField
        fullWidth
        multiline
        minRows={2}
        maxRows={4}
        placeholder="What are you working on?"
        value={draft}
        onChange={(e) => {
          const next = e.target.value
          setDraft(next)
          onDraftSync?.(next)
        }}
        onBlur={() => {
          if (timerRunning && typeof onCommit === 'function') {
            onCommit(draft)
          }
        }}
        disabled={submitted || saving}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '4px',
            fontSize: '0.9375rem',
            bgcolor: 'background.paper',
            '& fieldset': { borderColor: 'divider' },
            '&:hover fieldset': { borderColor: 'text.disabled' },
            '&.Mui-focused fieldset': { borderColor: 'text.secondary' },
          },
          '& .MuiInputBase-input::placeholder': {
            color: 'text.disabled',
            opacity: 1,
          },
        }}
      />
      <Button
        variant="contained"
        fullWidth
        disabled={!hasMemo || submitted || submitting}
        onClick={() => onSubmit?.(draft)}
        sx={{
          mt: 1.5,
          py: 1.25,
          borderRadius: '4px',
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.9375rem',
        }}
      >
        {submitted ? 'Submitted' : submitting ? 'Submitting…' : 'Submit'}
      </Button>
    </Box>
  )
}

export default memo(ProjectWorkMemo)
