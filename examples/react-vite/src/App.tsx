import { MDC } from 'mdc-syntax/react'
import Alert from './components/Alert'

const markdown = `
# Hello *World*

::alert{type="info"}
This is an alert!
::
`

export default function App() {
  return (
    <MDC
      markdown={markdown}
      components={{ Alert }}
    />
  )
}
