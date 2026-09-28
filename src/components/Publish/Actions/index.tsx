import {
  FormEvent,
  ReactElement,
  RefObject,
  useEffect,
  useRef,
  useState
} from 'react'
import { createPortal } from 'react-dom'
import Button from '@shared/atoms/Button'
import styles from './index.module.css'
import {
  FormikContextType,
  setNestedObjectValues,
  useFormikContext
} from 'formik'
import { FormPublishData } from '../_types'
import { wizardSteps } from '../_constants'
import SuccessConfetti from '@shared/SuccessConfetti'
import { useRouter } from 'next/router'
import Tooltip from '@shared/atoms/Tooltip'
import AvailableNetworks from '@components/Publish/AvailableNetworks'
import Info from '@images/info.svg'
import Loader from '@shared/atoms/Loader'
import useNetworkMetadata from '@hooks/useNetworkMetadata'
import { isAddress } from 'ethers'
import isUrl from 'is-url-superb'
import { isPrimaryLicenseReady } from '../_license'

interface StepProblem {
  message: string
  field?: string // formik field path to focus
  step?: number // earlier step to go back to
}

// Formik section per wizard step (errors under this key block Continue).
const STEP_SECTION: Record<number, keyof FormPublishData> = {
  1: 'metadata',
  2: 'credentials',
  3: 'services',
  4: 'pricing',
  5: 'additionalDdos'
}

function humanize(path: string): string {
  const last =
    path
      .split(/[.[\]]/)
      .filter((part) => part && !/^\d+$/.test(part))
      .pop() || path
  const words = last.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// Nested formik errors -> [{ field: 'services[0].files[0].url', message }]
function flattenErrors(value: unknown, path: string): StepProblem[] {
  if (!value) return []
  if (typeof value === 'string') {
    const label = humanize(path)
    const message = /^required\.?$/i.test(value.trim())
      ? `${label} is required.`
      : value.toLowerCase().includes(label.toLowerCase())
      ? value
      : `${label}: ${value}`
    return [{ field: path, message }]
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, i) => flattenErrors(item, `${path}[${i}]`))
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).flatMap(
      ([key, item]) => flattenErrors(item, `${path}.${key}`)
    )
  }
  return []
}

function focusField(field: string) {
  const el =
    document.querySelector<HTMLElement>(`[name="${field}"]`) ||
    document.getElementById(field)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  el.focus({ preventScroll: true })
}

function isValidUrl(url: string): boolean {
  if (!url?.trim()) return false

  const trimmedUrl = url.trim()
  if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
    return false
  }

  return isUrl(trimmedUrl)
}

export default function Actions({
  scrollToRef,
  did
}: {
  scrollToRef: RefObject<any>
  did: string
}): ReactElement {
  const router = useRouter()
  const { isSupportedOceanNetwork } = useNetworkMetadata()
  const {
    values,
    errors,
    isValid,
    isSubmitting,
    touched,
    setTouched,
    setFieldValue
  }: FormikContextType<FormPublishData> = useFormikContext()
  const [showSummary, setShowSummary] = useState(false)
  const [summaryTarget, setSummaryTarget] = useState<HTMLElement | null>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  // async function handleActivation(e: FormEvent<HTMLButtonElement>) {
  //   // prevent accidentially submitting a form the button might be in
  //   e.preventDefault()

  //   await connect()
  // }

  function handleAction(action: string) {
    const currentStep: string = router.query.step as string
    router.push({
      pathname: `${router.pathname}`,
      query: { step: parseInt(currentStep) + (action === 'next' ? +1 : -1) }
    })
    scrollToRef.current.scrollIntoView()
  }

  function handlePrevious(e: FormEvent) {
    e.preventDefault()
    handleAction('prev')
  }

  const hasValidAllowAddress = () => {
    // Check existing allow list
    if (values.credentials.allow?.length > 0) return true

    const typedValue = values.credentials.allowInputValue?.trim()
    if (!typedValue) return false

    // Check for wildcard
    if (typedValue === '*') return true

    // Check for valid address
    if (typedValue.length >= 40 && typedValue.startsWith('0x')) {
      try {
        return isAddress(typedValue)
      } catch (error) {
        console.error('Allow address validation error:', error)
      }
    }

    return false
  }

  const hasSSIButNoCredentialRequests = () => {
    // Early return if SSI not enabled
    if (!values.credentials?.enabled) return false

    const requestCredentials = values.credentials?.requestCredentials
    // Early return if no credential requests
    if (!requestCredentials?.length) return true

    // Check for invalid policies with early returns
    return requestCredentials.some((credential) => {
      const policies = credential?.policies
      if (!policies?.length) return false

      return policies.some((policy) => {
        if (!policy?.type) return false

        switch (policy.type) {
          case 'staticPolicy':
            return !policy.name?.trim()
          case 'parameterizedPolicy':
            return !policy.args?.length
          case 'customUrlPolicy': {
            return (
              !policy.name?.trim() ||
              !policy.policyUrl?.trim() ||
              !isValidUrl(policy.policyUrl) ||
              !policy.arguments?.length ||
              policy.arguments.some(
                (arg) => !arg.name?.trim() || !arg.value?.trim()
              )
            )
          }
          case 'customPolicy': {
            return (
              !policy.name?.trim() ||
              !policy.rules?.length ||
              policy.rules.some(
                (rule) =>
                  !rule.leftValue?.trim() ||
                  !rule.rightValue?.trim() ||
                  !rule.operator?.trim()
              )
            )
          }
          default:
            return false
        }
      })
    })
  }

  // Why the current step can't continue yet, in plain language. Continue
  // stays clickable; clicking it shows these in a summary (instead of a
  // silently disabled button).
  const stepProblems: StepProblem[] = (() => {
    const { stepCurrent } = values.user
    const problems: StepProblem[] = []
    const completed = [
      values.step1Completed,
      values.step2Completed,
      values.step3Completed,
      values.step4Completed,
      values.step5Completed
    ]
    // earlier steps that were never finished
    for (let n = 1; n < Math.min(stepCurrent, 6); n++) {
      if (!completed[n - 1]) {
        problems.push({
          message: `Complete step ${n} (${wizardSteps[n - 1].title}) first.`,
          step: n
        })
      }
    }
    const section = STEP_SECTION[stepCurrent]
    if (section) problems.push(...flattenErrors(errors[section], section))

    if (stepCurrent === 1 && !isPrimaryLicenseReady(values.metadata)) {
      problems.push({
        message:
          'Add a licence: enter a valid licence URL or upload a licence file.'
      })
    }
    if (stepCurrent === 2) {
      if (!hasValidAllowAddress()) {
        problems.push({
          message:
            'Add at least one wallet address to the allow list (use * to allow everyone).',
          field: 'credentials.allowInputValue'
        })
      }
      if (hasSSIButNoCredentialRequests()) {
        problems.push({
          message:
            'SSI access control is on: add at least one credential requirement and fill in its policy, or turn SSI access control off.'
        })
      }
    }
    return problems
  })()

  function handleNext(e: FormEvent) {
    e.preventDefault()

    if (stepProblems.length > 0) {
      const section = STEP_SECTION[values.user.stepCurrent]
      if (section && errors[section]) {
        setTouched(
          {
            ...touched,
            ...setNestedObjectValues({ [section]: errors[section] }, true)
          },
          false
        )
      }
      setShowSummary(true)
      // focus after render so screen readers announce the summary
      setTimeout(() => summaryRef.current?.focus(), 0)
      return
    }
    setShowSummary(false)

    const { stepCurrent } = values.user
    const stepCompletions = {
      1: ['step1Completed'],
      2: ['step2Completed'],
      3: ['step3Completed'],
      4: ['step4Completed'],
      5: ['step5Completed'],
      6: ['step6Completed', 'previewPageVisited'],
      7: ['submissionPageVisited']
    }

    const fieldsToSet = stepCompletions[stepCurrent] || []
    fieldsToSet.forEach((field) => setFieldValue(field, true))

    if (values.user.stepCurrent === 2) {
      const processAddress = (
        inputValue: string,
        fieldName: 'allow' | 'deny'
      ) => {
        const trimmedValue = inputValue?.trim()
        if (
          !trimmedValue ||
          trimmedValue.length < 40 ||
          !trimmedValue.startsWith('0x')
        ) {
          return
        }

        try {
          if (isAddress(trimmedValue)) {
            const lowerCaseAddress = trimmedValue.toLowerCase()
            const currentList = values.credentials[fieldName] || []

            if (!currentList.includes(lowerCaseAddress)) {
              const newList = [...currentList, lowerCaseAddress]
              setFieldValue(`credentials.${fieldName}`, newList)
              setFieldValue(`credentials.${fieldName}InputValue`, '')
            }
          }
        } catch (error) {
          console.error(
            `${fieldName} address validation error during auto-commit:`,
            error
          )
        }
      }

      processAddress(values.credentials.allowInputValue, 'allow')
      processAddress(values.credentials.denyInputValue, 'deny')
    }

    handleAction('next')
  }

  // Summary lives at the top of the step (mount point in Publish/index.tsx).
  useEffect(() => {
    setSummaryTarget(document.getElementById('publish-error-summary'))
  }, [])
  // New step: start without a summary.
  useEffect(() => {
    setShowSummary(false)
  }, [values.user.stepCurrent])

  const nextStepTitle = wizardSteps[values.user.stepCurrent]?.title
  const summary =
    showSummary && stepProblems.length > 0 ? (
      <div
        className={styles.errorSummary}
        ref={summaryRef}
        tabIndex={-1}
        role="alert"
        aria-labelledby="publish-error-summary-title"
      >
        <h3 id="publish-error-summary-title" className={styles.errorTitle}>
          Before you can continue
        </h3>
        <ul className={styles.errorList}>
          {stepProblems.map((problem, i) => (
            <li key={`${problem.field || problem.step || 'p'}-${i}`}>
              {problem.field || problem.step ? (
                <button
                  type="button"
                  className={styles.errorLink}
                  onClick={() =>
                    problem.field
                      ? focusField(problem.field)
                      : router.push(`/publish/${problem.step}`)
                  }
                >
                  {problem.message}
                </button>
              ) : (
                problem.message
              )}
            </li>
          ))}
        </ul>
      </div>
    ) : null

  const hasSubmitError = [1, 2, 3].some(
    (index) => values.feedback?.[index]?.status === 'error'
  )

  const isMetadataPage = values.user.stepCurrent === 1
  const actionsClassName = isMetadataPage ? styles.actionsRight : styles.actions

  return (
    <footer className={actionsClassName}>
      {summary && summaryTarget && createPortal(summary, summaryTarget)}
      {did ? (
        <SuccessConfetti
          className={styles.successConfettiWrapper}
          success="Successfully published!"
          action={
            <Button style="accent" to={`/asset/${did}`}>
              View Asset
            </Button>
          }
        />
      ) : (
        <>
          {values.user.stepCurrent > 1 && (
            <Button onClick={handlePrevious} disabled={isSubmitting}>
              Back
            </Button>
          )}

          {values.user.stepCurrent < wizardSteps.length ? (
            <Button style="accent" onClick={handleNext} disabled={isSubmitting}>
              {nextStepTitle ? `Continue to ${nextStepTitle}` : 'Continue'}
            </Button>
          ) : // !address ? (
          // <Button type="submit" style="primary" onClick={handleActivation}>
          //   Connect Wallet
          // </Button>
          // ) :
          !isSupportedOceanNetwork ? (
            <Tooltip content={<AvailableNetworks />}>
              <Button
                type="submit"
                style="accent"
                disabled
                className={styles.infoButton}
              >
                Unsupported Network <Info className={styles.infoIcon} />
              </Button>
            </Tooltip>
          ) : (
            <Button
              type="submit"
              style="accent"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? (
                <Loader variant="primary" />
              ) : hasSubmitError ? (
                'Try again'
              ) : (
                'Publish asset'
              )}
            </Button>
          )}
        </>
      )}
    </footer>
  )
}
