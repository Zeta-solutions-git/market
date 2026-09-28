import { FormikContextType, useFormikContext } from 'formik'
import React, { ReactElement, useEffect } from 'react'
import { useRouter } from 'next/router'
import { FormPublishData } from '../_types'
import { wizardSteps } from '../_constants'
import { useProgressBar } from '../../../@hooks/useProgressBar'
import { useStepCompletion } from '../../../@hooks/useStepCompletion'
import styles from './index.module.css'
import CheckmarkIcon from '@images/checkmark.svg'

export default function Navigation(): ReactElement {
  const router = useRouter()
  const { values, setFieldValue }: FormikContextType<FormPublishData> =
    useFormikContext()

  const { getSuccessClass, getLastCompletedStep } = useStepCompletion()

  // Step 5 (additional asset descriptions) can be skipped.
  const OPTIONAL_STEPS = new Set([5])

  function handleStepClick(step: number) {
    router.push(`/publish/${step}`)
  }

  function handleKeyDown(event: React.KeyboardEvent, step: number) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleStepClick(step)
    }
  }

  useEffect(() => {
    let step = 1
    if (router.query?.step) {
      const currentStep: string = router.query.step as string
      const stepParam: number = parseInt(currentStep)
      stepParam <= wizardSteps.length ? (step = stepParam) : handleStepClick(1)
    }
    setFieldValue('user.stepCurrent', step)
  }, [router, setFieldValue])

  const currentStep = values.user.stepCurrent
  const lastCompletedStep = getLastCompletedStep(wizardSteps.length)
  const progressTargetIdx = Math.min(lastCompletedStep + 1, wizardSteps.length)
  // Go back to any step freely; forward only up to the first unfinished step.
  const maxReachableStep = Math.max(progressTargetIdx, currentStep)
  const current = wizardSteps.find((s) => s.step === currentStep)

  const { stepRefs, stepsRowRef, progressBarWidth } = useProgressBar({
    progressTargetIdx
  })

  return (
    <nav className={styles.navigation} aria-label="Publish steps">
      <p className={styles.stepCounter}>
        Step {currentStep} of {wizardSteps.length}
        {current && (
          <>
            : <strong>{current.title}</strong>
            {OPTIONAL_STEPS.has(currentStep) && (
              <span className={styles.optional}> (optional)</span>
            )}
          </>
        )}
      </p>
      <div className={styles.stepsRow} ref={stepsRowRef}>
        <div
          className={styles.progressBar}
          style={{ width: `${progressBarWidth}px` }}
          aria-hidden="true"
        />
        {wizardSteps.map((step) => {
          const isActive = step.step === currentStep
          const isCompleted = getSuccessClass(step.step)
          const isLocked = step.step > maxReachableStep
          return (
            <div
              key={step.step}
              className={`${styles.step} ${
                isActive ? styles.activeStep : styles.inactiveStep
              } ${isLocked ? styles.locked : ''}`}
              onClick={() => !isLocked && handleStepClick(step.step)}
              onKeyDown={(e) => !isLocked && handleKeyDown(e, step.step)}
              role="button"
              tabIndex={isLocked ? -1 : 0}
              aria-disabled={isLocked || undefined}
              title={isLocked ? 'Complete the earlier steps first' : undefined}
              aria-current={isActive ? 'step' : undefined}
              aria-label={`Step ${step.step}: ${step.title}${
                isCompleted ? ' (completed)' : ''
              }`}
              ref={(el) => {
                stepRefs.current[step.step - 1] = el
              }}
            >
              <div
                className={`${
                  isActive ? styles.activeStepCircle : styles.inactiveStepCircle
                } ${isCompleted ? styles.completed : ''}`}
              >
                {isCompleted ? <CheckmarkIcon /> : step.step}
              </div>
              <span
                className={`${
                  isActive ? styles.activeStepLabel : styles.inactiveStepLabel
                }`}
              >
                {step.title}
              </span>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
