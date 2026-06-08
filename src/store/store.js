import { configureStore } from '@reduxjs/toolkit'
import loginFormReducer from './loginFormSlice'
import themeModeReducer from './themeModeSlice'

export const store = configureStore({
  reducer: {
    loginForm: loginFormReducer,
    themeMode: themeModeReducer,
  },
})
