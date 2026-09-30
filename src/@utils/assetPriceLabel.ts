import { Asset } from 'src/@types/Asset'
import { getServiceStats, resolveServiceTokenSymbol } from './priceToken'

type PriceEntryWithType = { type?: string; price?: string | number }

// Short price label for an asset card, from the indexed service stats
// (no extra requests): "Free", "10 USDC", "From 5 USDC" or "Free & paid".
export function getAssetPriceLabel(asset: Asset): string | undefined {
  const services = asset?.credentialSubject?.services || []
  let free = 0
  const paid: { price: number; symbol?: string }[] = []

  services.forEach((service, index) => {
    const stat = getServiceStats(
      asset,
      index,
      service.id,
      service.datatokenAddress
    )
    const entry = stat?.prices?.[0] as PriceEntryWithType | undefined
    if (!entry) return
    const price = Number(entry.price)
    if (entry.type === 'dispenser' || !price) {
      free++
      return
    }
    paid.push({
      price,
      symbol: resolveServiceTokenSymbol(
        asset,
        index,
        service.id,
        undefined,
        service.datatokenAddress
      )
    })
  })

  if (!free && !paid.length) return undefined
  if (!paid.length) return 'Free'
  if (free) return 'Free & paid'
  const cheapest = paid.reduce((a, b) => (b.price < a.price ? b : a))
  const label = `${cheapest.price}${
    cheapest.symbol ? ` ${cheapest.symbol}` : ''
  }`
  return paid.length > 1 ? `From ${label}` : label
}

// Plain-language labels for how an asset can be used.
export function getAssetUsageLabels(asset: Asset): string[] {
  const types = new Set(
    (asset?.credentialSubject?.services || []).map((s) => s.type)
  )
  const labels: string[] = []
  if (types.has('access')) labels.push('Download')
  if (types.has('compute')) labels.push('Compute-to-Data')
  return labels
}
