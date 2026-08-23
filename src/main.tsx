import { createRoot } from 'react-dom/client'
import { App } from './ui/App.tsx'
import './ui/styles.css'

const root = document.getElementById('root')
if (root === null) throw new Error('missing #root')

createRoot(root).render(<App />)
