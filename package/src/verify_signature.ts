import { verifyMessage, isAddress } from 'viem'

export interface VerifySignatureOptions {
  address: string
  message: string
  signature: `0x${string}`
}

export async function verifySignature(options: VerifySignatureOptions): Promise<boolean> {
  const { address, message, signature } = options

  if (!isAddress(address)) {
    return false
  }

  try {
    return await verifyMessage({
      address: address as `0x${string}`,
      message,
      signature,
    })
  } catch {
    return false
  }
}
