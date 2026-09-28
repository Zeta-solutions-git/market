import { ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { LoggerInstance } from '@oceanprotocol/lib'
import { getAllComputeJobs } from '@utils/compute'
import { useUserPreferences } from '@context/UserPreferences'
import { useCancelToken } from '@hooks/useCancelToken'
import { useEthersSigner } from '@hooks/useEthersSigner'
import ComputeJobs from '../History/ComputeJobs'

// Same fetch behaviour as the former "Compute Jobs" tab (History/index.tsx).
export default function ComputeJobsSection(): ReactElement {
  const { address: accountId } = useAccount()
  const signer = useEthersSigner()
  const { chainIds } = useUserPreferences()
  const newCancelToken = useCancelToken()

  const [refetch, setRefetch] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [jobs, setJobs] = useState<ComputeJobMetaData[]>([])
  const isFetchingRef = useRef(false)

  const fetchJobs = useCallback(async () => {
    if (!chainIds || chainIds.length === 0 || !accountId || !signer) return
    if (isFetchingRef.current) return

    try {
      isFetchingRef.current = true
      setIsLoading(true)
      const result = await getAllComputeJobs(
        accountId,
        signer,
        newCancelToken(),
        chainIds
      )
      setJobs(result?.computeJobs)
      setIsLoading(!result.isLoaded)
    } catch (error) {
      LoggerInstance.error(error.message)
      setIsLoading(false)
    } finally {
      isFetchingRef.current = false
    }
  }, [accountId, chainIds, newCancelToken, signer])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs, refetch])

  return (
    <ComputeJobs
      jobs={jobs}
      isLoading={isLoading}
      refetchJobs={() => setRefetch((value) => !value)}
    />
  )
}
