import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './storybook/storybook.css'
import StorybookApp from './storybook/StorybookApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StorybookApp />
  </StrictMode>,
)
