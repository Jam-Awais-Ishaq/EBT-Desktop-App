import { useMemo } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import {
  setEmail,
  setEmailError,
  setPassword,
  submitLogin,
  toggleShowPassword,
} from '../../store/loginFormSlice'

/** Practical email shape check (local-part@domain.tld). */
export function isValidEmail(value) {
  const v = value.trim()
  if (!v) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

/** Empty string when valid; otherwise a user-facing message. */
export function getEmailValidationMessage(email) {
  const v = email.trim()
  if (!v) return 'Email is required'
  if (!isValidEmail(v)) return 'Enter a valid email address'
  return ''
}

/** Redux selector — keep field names aligned with the slice. */
export function selectLoginFormState(state) {
  return state.loginForm
}

/**
 * Pure factory: returns stable handler objects for a given dispatch + getState.
 * Keeps event → action wiring out of JSX.
 */
export function createLoginFormHandlers(dispatch, getState) {
  return {
    onEmailChange(event) {
      dispatch(setEmail(event.target.value))
    },
    onEmailBlur() {
      const { email } = getState().loginForm
      dispatch(setEmailError(getEmailValidationMessage(email)))
    },
    onPasswordChange(event) {
      dispatch(setPassword(event.target.value))
    },
    onToggleShowPassword() {
      dispatch(toggleShowPassword())
    },
    onSubmit(event) {
      event.preventDefault()
      const { email } = getState().loginForm
      const message = getEmailValidationMessage(email)
      if (message) {
        dispatch(setEmailError(message))
        return
      }
      dispatch(setEmailError(''))
      dispatch(submitLogin())
    },
  }
}

/** Connects the login form slice to the UI. */
export function useLoginForm() {
  const dispatch = useDispatch()
  const store = useStore()
  const { email, password, showPassword, emailError, authError, isLoading } =
    useSelector(selectLoginFormState)

  const handlers = useMemo(
    () => createLoginFormHandlers(dispatch, () => store.getState()),
    [dispatch, store],
  )

  return {
    email,
    emailError,
    authError,
    isLoading,
    password,
    showPassword,
    ...handlers,
  }
}
