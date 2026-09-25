import { ReactElement } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import styles from '@shared/SiteLayout/content.module.css'

interface Step {
  icon: string
  title: string
  text: string
  done: boolean
}

// Landing page at the end of the Authentik signup flow. The flow redirects here
// with ?verified=1 once email verification is enabled; without it (no SMTP yet)
// we don't promise emails we can't send.
export default function SignupSubmitted(): ReactElement {
  const router = useRouter()
  const verified = router.query.verified === '1'

  const steps: Step[] = [
    {
      icon: 'check_circle',
      title: 'Account created',
      text: 'Your registration has been received.',
      done: true
    },
    ...(verified
      ? [
          {
            icon: 'check_circle',
            title: 'Email address confirmed',
            text: 'Thanks for verifying your email address.',
            done: true
          }
        ]
      : []),
    {
      icon: 'hourglass_top',
      title: 'Review by the ODL team',
      text: 'Every account is checked by the Open Dataspace Lab team. This usually takes a few days.',
      done: false
    },
    {
      icon: verified ? 'mail' : 'login',
      title: verified ? 'We’ll email you' : 'Log in once approved',
      text: verified
        ? 'You’ll receive an email as soon as your account is approved, after which you can log in with your username or email address.'
        : 'Once your account is approved you can log in with your username or email address.',
      done: false
    }
  ]

  return (
    <section
      className={`${styles.section} ${styles.sectionAlt} ${styles.notFound}`}
      aria-label="Application received"
    >
      <div className={styles.sectionInner}>
        <div className={styles.comingSoon}>
          <span
            className={`material-symbols-rounded ${styles.comingSoonIcon}`}
            aria-hidden="true"
          >
            how_to_reg
          </span>
          <h1 className={styles.notFoundTitle}>Thanks for signing up</h1>
          <p className={styles.comingSoonText}>
            Your application is now with the Open Dataspace Lab team.
            Here&apos;s what happens next.
          </p>
          <ol className={styles.signupSteps}>
            {steps.map((step) => (
              <li
                key={step.title}
                className={`${styles.signupStep} ${
                  step.done ? styles.signupStepDone : ''
                }`}
              >
                <span
                  className={`material-symbols-rounded ${styles.signupStepIcon}`}
                  aria-hidden="true"
                >
                  {step.icon}
                </span>
                <span>
                  <span className={styles.signupStepTitle}>{step.title}</span>
                  <span className={styles.signupStepText}>{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
          <Link href="/" className={styles.notFoundHome}>
            Back to homepage
          </Link>
        </div>
      </div>
    </section>
  )
}
