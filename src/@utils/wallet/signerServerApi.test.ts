import {
  InsufficientFundsError,
  SignerServerError,
  sendSignerServerTransaction,
  takeLastSignerServerError
} from './signerServerApi'

const tx = {
  chainId: 11155111,
  to: '0x0000000000000000000000000000000000000001' as const
}

function mockResponse(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: () => Promise.resolve(body)
  }) as jest.Mock
}

describe('signerServerApi errors', () => {
  it('turns an insufficient funds response into a readable error', async () => {
    mockResponse(400, {
      statusCode: 400,
      message:
        'Insufficient funds for transaction: wallet 0x846F3070BC2812BF0bbdcf6b18333e844aeC974C on chain ID 11155111 has 500000000000000 wei, needs at least 659613667974588 wei'
    })

    const error = await sendSignerServerTransaction(tx).catch((e) => e)

    expect(error).toBeInstanceOf(InsufficientFundsError)
    expect(error.message).toBe(
      'Insufficient funds: your wallet has 0.0005 ETH, but this transaction needs at least 0.0006596 ETH for gas. Please top up your wallet and try again.'
    )
    expect(takeLastSignerServerError()).toBe(error)
    expect(takeLastSignerServerError()).toBeUndefined()
  })

  it('uses the signer server message for other errors', async () => {
    mockResponse(400, { message: ['to must be an Ethereum address'] })

    const error = await sendSignerServerTransaction(tx).catch((e) => e)

    expect(error).toBeInstanceOf(SignerServerError)
    expect(error).not.toBeInstanceOf(InsufficientFundsError)
    expect(error.message).toBe('to must be an Ethereum address')
  })

  it('keeps the proxy error field', async () => {
    mockResponse(401, { error: 'Signer server login is required.' })

    const error = await sendSignerServerTransaction(tx).catch((e) => e)

    expect(error.message).toBe('Signer server login is required.')
    expect(error.status).toBe(401)
  })
})
