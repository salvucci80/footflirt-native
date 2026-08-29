import { Platform } from 'react-native'
import { addressToPublicKey } from './walletAddress'

export const APP_IDENTITY = {
  name: 'FootFlirt',
  uri: 'https://footflirt.app',
  icon: '/icon.png',
}

export const RPC_URL = 'https://mainnet.helius-rpc.com/?api-key=9e777985-1352-456c-8e9a-09b8d5d3ee52'
export const FEE_WALLET = 'AkBbqRjjLka9oeCnuXhNH5UqdjfzYoqeh7sh5gnrosP6'

export function supportsMobileWalletAdapter() {
  return Platform.OS === 'android'
}

export function accountAddressToBase58(rawAddress: unknown, PublicKey: any) {
  return addressToPublicKey(rawAddress, PublicKey).toBase58()
}

export async function authorizeSession(walletAdapter: any, authToken?: string) {
  if (authToken) {
    try {
      return await walletAdapter.reauthorize({
        auth_token: authToken,
        identity: APP_IDENTITY,
      })
    } catch {
      // Token may have expired — fall back to a fresh authorize prompt.
    }
  }

  return walletAdapter.authorize({
    cluster: 'mainnet-beta',
    identity: APP_IDENTITY,
  })
}

export async function connectSolanaWallet() {
  if (!supportsMobileWalletAdapter()) {
    throw new Error(
      'Solana wallet connect requires the Android app. Use email sign-in on other devices, or install Phantom or Solflare on Android.'
    )
  }

  const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol-web3js')
  const { PublicKey } = await import('@solana/web3.js')

  const result = await transact(async (wallet: any) => authorizeSession(wallet))
  return {
    address: accountAddressToBase58(result.accounts[0].address, PublicKey),
    authToken: result.auth_token || '',
  }
}

type WalletTransactionContext = {
  walletAdapter: any
  authResult: any
  PublicKey: any
  Connection: any
  Transaction: any
  SystemProgram: any
  LAMPORTS_PER_SOL: number
}

export async function withWalletTransaction<T>(
  authToken: string | undefined,
  fn: (ctx: WalletTransactionContext) => Promise<T>
) {
  if (!supportsMobileWalletAdapter()) {
    throw new Error('Wallet payments require the Android app with Phantom or Solflare installed.')
  }

  const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol-web3js')
  const web3 = await import('@solana/web3.js')
  const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = web3

  return transact(async (walletAdapter: any) => {
    const authResult = await authorizeSession(walletAdapter, authToken)
    return fn({
      walletAdapter,
      authResult,
      PublicKey,
      Connection,
      Transaction,
      SystemProgram,
      LAMPORTS_PER_SOL,
    })
  })
}

export function createConnection(Connection: any) {
  return new Connection(RPC_URL)
}

export function walletPubkeyFromAuth(authResult: any, PublicKey: any) {
  const raw = authResult.accounts[0].address
  if (typeof raw === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(raw)) {
    return new PublicKey(raw)
  }
  return addressToPublicKey(raw, PublicKey)
}
