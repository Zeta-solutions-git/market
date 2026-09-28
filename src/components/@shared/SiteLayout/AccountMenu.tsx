import {
  KeyboardEvent as ReactKeyboardEvent,
  ReactElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useAccount } from 'wagmi'
import { useAuth } from '@hooks/useAuth'
import { useSignOut } from '@hooks/useSignOut'
import InitialsAvatar from '@shared/atoms/InitialsAvatar'
import { getDisplayName, getFirstName, getInitials } from '@utils/userDisplay'
import styles from './AccountMenu.module.css'

// Query strings are the contract with the profile page — do not change.
const MENU_LINKS = [
  { label: 'My profile', href: '/profile?section=overview', icon: 'person' },
  { label: 'My assets', href: '/profile?section=assets', icon: 'inventory_2' },
  { label: 'Compute jobs', href: '/profile?section=compute', icon: 'memory' },
  { label: 'Settings', href: '/profile?section=settings', icon: 'settings' }
]

function Icon({ name }: { name: string }): ReactElement {
  return (
    <span
      className={`material-symbols-rounded ${styles.icon}`}
      aria-hidden="true"
    >
      {name}
    </span>
  )
}

// Logged-in account dropdown shown in the site nav on every page.
export default function AccountMenu(): ReactElement {
  const { user } = useAuth()
  const { isConnected } = useAccount()
  const { signOut, isSigningOut } = useSignOut()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const displayName = getDisplayName(user) || 'Account'
  const firstName = getFirstName(user)
  const initials = getInitials(user)
  const company = user?.company?.trim()

  const getItems = useCallback(
    (): HTMLElement[] =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ||
          []
      ),
    []
  )

  const focusItem = useCallback(
    (index: number) => {
      const items = getItems()
      if (!items.length) return
      const i = (index + items.length) % items.length
      items[i].focus()
    },
    [getItems]
  )

  const close = useCallback((returnFocus = false) => {
    setOpen(false)
    if (returnFocus) triggerRef.current?.focus()
  }, [])

  // Click outside closes
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent | TouchEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open])

  // Route change closes
  useEffect(() => {
    const onRouteChange = () => setOpen(false)
    router.events.on('routeChangeStart', onRouteChange)
    return () => router.events.off('routeChangeStart', onRouteChange)
  }, [router.events])

  // Focus first item when opened
  useEffect(() => {
    if (open) focusItem(0)
  }, [open, focusItem])

  function onTriggerKeyDown(e: ReactKeyboardEvent<HTMLButtonElement>) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      if (!open) setOpen(true)
      else focusItem(e.key === 'ArrowDown' ? 0 : -1)
    } else if (e.key === 'Escape' && open) {
      e.preventDefault()
      close(true)
    }
  }

  function onPanelKeyDown(e: ReactKeyboardEvent<HTMLDivElement>) {
    const items = getItems()
    const current = items.indexOf(document.activeElement as HTMLElement)
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        focusItem(current + 1)
        break
      case 'ArrowUp':
        e.preventDefault()
        focusItem(current - 1)
        break
      case 'Home':
        e.preventDefault()
        focusItem(0)
        break
      case 'End':
        e.preventDefault()
        focusItem(-1)
        break
      case 'Escape':
        e.preventDefault()
        close(true)
        break
      case 'Tab':
        setOpen(false)
        break
    }
  }

  async function handleSignOut() {
    await signOut()
    setOpen(false)
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Account menu for ${displayName}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
      >
        <InitialsAvatar initials={initials} size={36} />
        {firstName && <span className={styles.firstName}>{firstName}</span>}
        <span
          className={`material-symbols-rounded ${styles.caret} ${
            open ? styles.caretOpen : ''
          }`}
          aria-hidden="true"
        >
          expand_more
        </span>
      </button>

      {open && (
        <div
          ref={panelRef}
          id={menuId}
          className={styles.panel}
          role="menu"
          aria-label="Account"
          onKeyDown={onPanelKeyDown}
        >
          <div className={styles.header} role="none">
            <div className={styles.name}>{displayName}</div>
            {(user?.email || company) && (
              <div className={styles.meta}>
                {[user?.email, company].filter(Boolean).join(' · ')}
              </div>
            )}
            <div className={styles.status}>
              <span
                className={`${styles.dot} ${
                  isConnected ? styles.dotOn : styles.dotOff
                }`}
                aria-hidden="true"
              />
              {isConnected ? 'Wallet connected' : 'Wallet not connected'}
            </div>
          </div>

          <div className={styles.divider} role="separator" />

          {MENU_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              tabIndex={-1}
              className={styles.item}
              onClick={() => setOpen(false)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          ))}

          <div className={styles.divider} role="separator" />

          <Link
            href="/contact"
            role="menuitem"
            tabIndex={-1}
            className={styles.item}
            onClick={() => setOpen(false)}
          >
            <Icon name="help" />
            <span>Help &amp; support</span>
          </Link>

          <div className={styles.divider} role="separator" />

          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            className={`${styles.item} ${styles.signOut}`}
            onClick={handleSignOut}
            disabled={isSigningOut}
            aria-busy={isSigningOut}
          >
            <Icon name="logout" />
            <span>{isSigningOut ? 'Signing out…' : 'Sign out'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
