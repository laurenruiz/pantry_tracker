'use client'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

const theme = createTheme({
  palette: {
    primary: { main: '#FFC0D4' },
    secondary: { main: '#FFB0C9' },
    background: { default: '#FFF0F5' },
    text: { primary: '#000000' },
  },
  typography: {
    fontFamily: '"Press Start 2P", cursive',
    h1: { fontSize: '3.9rem' },
    h3: { fontSize: '1.95rem' },
    h4: { fontSize: '1.5rem' },
    h6: { fontSize: '1rem' },
    body1: { fontSize: '0.85rem' },
    button: { fontSize: '0.75rem' },
  },
})

export default function Providers({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
