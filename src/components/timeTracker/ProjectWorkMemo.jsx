import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { alpha, useTheme } from '@mui/material/styles'
import { memo, useEffect, useState } from 'react'

import { primaryActionButtonSx, sectionLabelSx } from '../../theme/uiStyles'

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
  const theme = useTheme()
  const [draft, setDraft] = useState(value ?? '')
  const hasMemo = Boolean(String(draft).trim())

  useEffect(() => {
    setDraft(value ?? '')
  }, [value])

  return (
    <Box sx={{ py: 1.5 }}>
      <Typography sx={{ ...sectionLabelSx, mb: 1.25 }}>Work summary</Typography>
      <TextField
        fullWidth
        multiline
        minRows={3}
        maxRows={5}
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
            borderRadius: '6px',
            fontSize: '0.9375rem',
            bgcolor: 'background.paper',
            '& fieldset': { borderColor: 'divider' },
            '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.4) },
            '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 },
          },
          '& .MuiInputBase-input': {
            color: 'text.primary',
            fontWeight: 500,
          },
          '& .MuiInputBase-input::placeholder': {
            color: 'text.secondary',
            opacity: 1,
          },
        }}
      />
      <Button
        variant="contained"
        color="primary"
        fullWidth
        disabled={!hasMemo || submitted || submitting}
        onClick={() => onSubmit?.(draft)}
        sx={{
          mt: 1.75,
          ...primaryActionButtonSx(theme),
        }}
      >
        {submitted ? 'Submitted' : submitting ? 'Submitting…' : 'Submit for review'}
      </Button>
      {!hasMemo && !submitted ? (
        <Typography sx={{ mt: 1, fontSize: '0.75rem', color: 'text.secondary', textAlign: 'center' }}>
          Add a short summary before submitting.
        </Typography>
      ) : null}
    </Box>
  )
}

export default memo(ProjectWorkMemo)
