import { ReactElement } from 'react'
import styles from './index.module.css'

// Classic initials avatar (e.g. "FB"). `size` in px.
export default function InitialsAvatar({
  initials,
  size = 36,
  className
}: {
  initials: string
  size?: number
  className?: string
}): ReactElement {
  return (
    <span
      className={`${styles.avatar} ${className || ''}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}
