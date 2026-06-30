// Solana Mobile Wallet Adapter can return accounts[0].address as a true
// Uint8Array, a plain array/array-like (after crossing the native bridge),
// or a base64/base64url string. This normalizes any of those into a PublicKey.
export function addressToPublicKey(raw: any, PublicKey: any) {
  if (raw instanceof Uint8Array) {
    return new PublicKey(raw)
  }
  if (Array.isArray(raw)) {
    return new PublicKey(Uint8Array.from(raw))
  }
  if (raw && typeof raw === 'object' && typeof raw.length === 'number') {
    return new PublicKey(Uint8Array.from(Object.values(raw) as number[]))
  }

  const str = String(raw)
  const looksBase58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(str)
  if (looksBase58) {
    return new PublicKey(str)
  }

  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const bin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  const bytes: number[] = []
  for (let i = 0; i < b64.length; i += 4) {
    const a = bin.indexOf(b64[i])
    const b = bin.indexOf(b64[i + 1])
    const c = bin.indexOf(b64[i + 2])
    const d = bin.indexOf(b64[i + 3])
    bytes.push((a << 2) | (b >> 4))
    if (c !== 64 && c !== -1) bytes.push(((b & 15) << 4) | (c >> 2))
    if (d !== 64 && d !== -1) bytes.push(((c & 3) << 6) | d)
  }
  return new PublicKey(Uint8Array.from(bytes))
}
