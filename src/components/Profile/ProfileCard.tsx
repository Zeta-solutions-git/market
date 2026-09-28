import { ReactElement } from 'react'
import Avatar from '@shared/atoms/Avatar'
import InitialsAvatar from '@shared/atoms/InitialsAvatar'
import Copy from '@shared/atoms/Copy'
import { useAuth } from '@hooks/useAuth'
import { useProfile } from '@context/Profile'
import { useAddressConfig } from '@hooks/useAddressConfig'
import { accountTruncate } from '@utils/wallet'
import { getDisplayName, getInitials } from '@utils/userDisplay'
import styles from './ProfileCard.module.css'

function formatMemberSince(iso?: string): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

// Identity header of the profile page. Own profile: who you are (name, company,
// email, member since). Someone else's profile: their public wallet identity.
export default function ProfileCard({
  accountId
}: {
  accountId: string
}): ReactElement {
  const { ownAccount } = useProfile()
  const { user } = useAuth()
  const { verifiedWallets } = useAddressConfig()

  if (!ownAccount || !user) {
    const name = verifiedWallets?.[accountId] || accountTruncate(accountId)
    return (
      <div className={styles.card}>
        <Avatar accountId={accountId} className={styles.blockie} />
        <div className={styles.identity}>
          <h1 className={styles.name}>{name}</h1>
          <p className={styles.meta}>
            <code className={styles.address}>{accountTruncate(accountId)}</code>
            <Copy text={accountId} />
          </p>
        </div>
      </div>
    )
  }

  const memberSince = formatMemberSince(user.memberSince)

  return (
    <div className={styles.card}>
      <InitialsAvatar initials={getInitials(user)} size={72} />
      <div className={styles.identity}>
        <div className={styles.nameRow}>
          <h1 className={styles.name}>{getDisplayName(user)}</h1>
          <span className={styles.badge}>
            <span
              className={`material-symbols-rounded ${styles.badgeIcon}`}
              aria-hidden="true"
            >
              verified
            </span>
            Approved account
          </span>
        </div>
        <p className={styles.meta}>
          {user.company && <span>{user.company}</span>}
          {user.email && <span>{user.email}</span>}
          {memberSince && <span>Member since {memberSince}</span>}
        </p>
      </div>
    </div>
  )
}
