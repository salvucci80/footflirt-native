import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Modal, Linking } from 'react-native'
import { showAlert } from './CustomAlert'
import { FEE_WALLET, createConnection, withWalletTransaction, walletPubkeyFromAuth } from '../lib/solanaWallet'

interface Props {
  wallet: string
  authToken: string
  onBack: () => void
}

const PRICE_SOL = 0.1
const PRICE_USD = 9.99 // used for USDC (1:1), Ansem (converted live), and PayPal
const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const ANSEM_MINT = 'REPLACE_WITH_ANSEM_MINT_ADDRESS'
const PAYPAL_CLIENT_ID = 'REPLACE_WITH_PAYPAL_CLIENT_ID'

type PayMethod = 'SOL' | 'USDC' | 'ANSEM' | 'PAYPAL'

export default function FlirtPassScreen({ wallet, authToken, onBack }: Props) {
  const [buying, setBuying] = useState(false)
  const [active, setActive] = useState(false)
  const [payModal, setPayModal] = useState<{ url: string } | null>(null)
  const [method, setMethod] = useState<PayMethod>('SOL')
  const [ansemQuote, setAnsemQuote] = useState<{ amount: number; decimals: number } | null>(null)

  // Live Ansem quote, since its USD value moves.
  useEffect(() => {
    if (method !== 'ANSEM') return
    let cancelled = false
    fetch(`https://api.jup.ag/price/v2?ids=${ANSEM_MINT}`)
      .then(r => r.json())
      .then(async data => {
        const price = Number(data?.data?.[ANSEM_MINT]?.price)
        if (!price) return
        const { getMint } = await import('@solana/spl-token')
        const { Connection, PublicKey } = await import('@solana/web3.js')
        const connection = createConnection(Connection)
        const mintInfo = await getMint(connection, new PublicKey(ANSEM_MINT))
        if (cancelled) return
        setAnsemQuote({ amount: PRICE_USD / price, decimals: mintInfo.decimals })
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [method])

  async function payWithSolanaToken(mint: string, uiAmount: number, decimals: number) {
    await withWalletTransaction(authToken, async ({ walletAdapter, authResult, PublicKey, Connection, Transaction }) => {
      const connection = createConnection(Connection)
      const {
        getAssociatedTokenAddress,
        createAssociatedTokenAccountInstruction,
        createTransferInstruction,
        getAccount
      } = await import('@solana/spl-token')

      const fromPubkey = walletPubkeyFromAuth(authResult, PublicKey)
      const mintPubkey = new PublicKey(mint)
      const feeWalletPubkey = new PublicKey(FEE_WALLET)

      const fromAta = await getAssociatedTokenAddress(mintPubkey, fromPubkey)
      const toAta = await getAssociatedTokenAddress(mintPubkey, feeWalletPubkey)

      const tx = new Transaction()
      try {
        await getAccount(connection, toAta)
      } catch {
        tx.add(createAssociatedTokenAccountInstruction(fromPubkey, toAta, feeWalletPubkey, mintPubkey))
      }

      const rawAmount = Math.round(uiAmount * 10 ** decimals)
      tx.add(createTransferInstruction(fromAta, toAta, fromPubkey, rawAmount))

      const { blockhash } = await connection.getLatestBlockhash()
      tx.recentBlockhash = blockhash
      tx.feePayer = fromPubkey
      const signedTxs = await walletAdapter.signTransactions({ transactions: [tx] })
      const sig = await connection.sendRawTransaction(signedTxs[0].serialize())
      await connection.confirmTransaction(sig)

      await fetch('https://footflirt.app/api/extras?action=flirtpass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: wallet, tx_signature: sig, payment_method: mint === USDC_MINT ? 'USDC' : 'ANSEM' })
      })
      setActive(true)
      showAlert('FlirtPass activated!')
    })
  }

  async function subscribe() {
    setBuying(true)

    if (method === 'PAYPAL') {
      setBuying(false)
      return // handled by the PayPal button itself
    }

    if (wallet.startsWith('email:')) {
      // Email-wallet users pay via a plain Solana Pay deep link.
      // Known limitation: this path isn't recorded server-side yet (same gap as tips).
      const params = method === 'SOL'
        ? `amount=${PRICE_SOL}`
        : `amount=${method === 'USDC' ? PRICE_USD : (ansemQuote?.amount || 0)}&spl-token=${method === 'USDC' ? USDC_MINT : ANSEM_MINT}`
      setPayModal({ url: `solana:${FEE_WALLET}?${params}&label=FlirtPass` })
      setBuying(false)
      return
    }

    try {
      if (method === 'SOL') {
        await withWalletTransaction(authToken, async ({ walletAdapter, authResult, PublicKey, Connection, Transaction, SystemProgram, LAMPORTS_PER_SOL }) => {
          const connection = createConnection(Connection)
          const fromPubkey = walletPubkeyFromAuth(authResult, PublicKey)
          const tx = new Transaction().add(
            SystemProgram.transfer({ fromPubkey, toPubkey: new PublicKey(FEE_WALLET), lamports: PRICE_SOL * LAMPORTS_PER_SOL })
          )
          const { blockhash } = await connection.getLatestBlockhash()
          tx.recentBlockhash = blockhash
          tx.feePayer = fromPubkey
          const signedTxs = await walletAdapter.signTransactions({ transactions: [tx] })
          const sig = await connection.sendRawTransaction(signedTxs[0].serialize())
          await connection.confirmTransaction(sig)
          await fetch('https://footflirt.app/api/extras?action=flirtpass', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: wallet, tx_signature: sig, payment_method: 'SOL' })
          })
          setActive(true)
          showAlert('FlirtPass activated!')
        })
      } else if (method === 'USDC') {
        await payWithSolanaToken(USDC_MINT, PRICE_USD, 6)
      } else if (method === 'ANSEM') {
        if (!ansemQuote) { showAlert('Quote still loading, try again in a moment'); return }
        await payWithSolanaToken(ANSEM_MINT, ansemQuote.amount, ansemQuote.decimals)
      }
    } catch (e: any) {
      showAlert('Subscribe Error', String(e?.message || e))
    } finally {
      setBuying(false)
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>FlirtPass</Text>
        <Text style={styles.subtitle}>Premium membership for serious creators</Text>

        {active && (
          <View style={styles.activeBadge}>
            <Text style={styles.activeText}>Active</Text>
          </View>
        )}

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>What you get:</Text>
          {[
            ['Unlimited posts per day', 'vs 3 for free'],
            ['Exclusive FlirtPass sticker pack', 'gold exclusive designs'],
            ['Gold badge on your profile', 'stand out in the feed'],
            ['Priority in feed ranking', 'get seen first'],
            ['Early access to new features', 'before everyone else'],
          ].map(([title, sub]) => (
            <View key={title} style={styles.featureRow}>
              <Text style={styles.check}>+</Text>
              <View>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureSub}>{sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {!active && (
          <>
            <View style={styles.methodRow}>
              {(['SOL', 'USDC', 'ANSEM', 'PAYPAL'] as PayMethod[]).map(m => (
                <TouchableOpacity key={m} onPress={() => setMethod(m)} style={[styles.methodBtn, method === m && styles.methodBtnActive]}>
                  <Text style={[styles.methodText, method === m && styles.methodTextActive]}>{m === 'PAYPAL' ? 'PayPal' : m}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {method !== 'PAYPAL' ? (
              <TouchableOpacity style={styles.subscribeBtn} onPress={subscribe} disabled={buying}>
                {buying ? <ActivityIndicator color="#000" /> : (
                  <Text style={styles.subscribeText}>
                    {method === 'SOL' ? `Subscribe for ${PRICE_SOL} SOL/month`
                      : method === 'USDC' ? `Subscribe for $${PRICE_USD} USDC/month`
                      : ansemQuote ? `Subscribe for ~${ansemQuote.amount.toFixed(0)} ANSEM/month`
                      : 'Loading quote...'}
                  </Text>
                )}
              </TouchableOpacity>
            ) : (
              <PayPalWebButton
                clientId={PAYPAL_CLIENT_ID}
                onApproved={async (orderId) => {
                  await fetch('https://footflirt.app/api/extras?action=flirtpass', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ wallet_address: wallet, payment_method: 'PAYPAL', paypal_order_id: orderId })
                  })
                  setActive(true)
                  showAlert('FlirtPass activated!')
                }}
              />
            )}
          </>
        )}

        <Text style={styles.disclaimer}>Renews monthly. Cancel anytime by not renewing.</Text>
      </ScrollView>

      <Modal visible={!!payModal} transparent animationType="fade" onRequestClose={() => setPayModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <Text style={styles.qrTitle}>💸 Pay with Wallet</Text>
            <Text style={styles.qrSub}>Open your Solana wallet to complete your FlirtPass payment</Text>
            <TouchableOpacity style={styles.qrBtn} onPress={() => { Linking.openURL(payModal!.url); setPayModal(null) }}>
              <Text style={styles.qrBtnText}>Open Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.qrBtn, {backgroundColor:'rgba(255,255,255,.08)', marginTop: 8}]} onPress={() => setPayModal(null)}>
              <Text style={[styles.qrBtnText, {color:'#fff'}]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

// Web-only PayPal Smart Buttons (this screen also runs under `expo start --web`).
// Note: not yet wired up for the standalone native build — PayPal on native
// would need react-native-webview or an in-app browser flow instead.
function PayPalWebButton({ clientId, onApproved }: { clientId: string; onApproved: (orderId: string) => void }) {
  const containerRef = React.useRef<any>(null)

  useEffect(() => {
    const scriptId = 'paypal-sdk'
    function render() {
      if (!containerRef.current || !(window as any).paypal) return
      containerRef.current.innerHTML = ''
      ;(window as any).paypal.Buttons({
        createOrder: async () => {
          const resp = await fetch('https://footflirt.app/api/extras?action=paypal-create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ purpose: 'flirtpass' })
          })
          const data = await resp.json()
          return data.orderID
        },
        onApprove: async (data: any) => {
          const resp = await fetch('https://footflirt.app/api/extras?action=paypal-capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderID: data.orderID })
          })
          const result = await resp.json()
          if (result.success) onApproved(data.orderID)
          else showAlert('Payment could not be captured')
        }
      }).render(containerRef.current)
    }

    if (typeof document === 'undefined') return // native runtime, no DOM
    if ((window as any).paypal) { render(); return }
    if (document.getElementById(scriptId)) return
    const script = document.createElement('script')
    script.id = scriptId
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`
    script.onload = render
    document.body.appendChild(script)
  }, [])

  if (typeof document === 'undefined') {
    return <Text style={{ color: '#998aaa', fontSize: 12, textAlign: 'center' }}>PayPal is available on the web version for now.</Text>
  }

  // @ts-ignore — plain DOM ref, only reached on web
  return <div ref={containerRef} />
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080010' },
  backBtn: { padding: 16, paddingTop: 48 },
  backText: { color: '#fff', fontSize: 14 },
  content: { padding: 24, alignItems: 'center' },
  title: { fontSize: 32, color: '#FFD700', fontWeight: '900', letterSpacing: 3, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#998aaa', textAlign: 'center', marginBottom: 24 },
  activeBadge: {
    backgroundColor: 'rgba(0,255,178,.15)',
    borderWidth: 1, borderColor: 'rgba(0,255,178,.3)',
    borderRadius: 16, padding: 12, marginBottom: 24,
  },
  activeText: { color: '#00FFB2', fontWeight: '700' },
  featuresCard: {
    width: '100%', backgroundColor: '#120020',
    borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,215,0,.2)', marginBottom: 24,
  },
  featuresTitle: { fontSize: 14, color: '#FFD700', fontWeight: '700', marginBottom: 12 },
  featureRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  check: { color: '#FFD700', fontSize: 16, fontWeight: '900' },
  featureTitle: { fontSize: 13, color: '#fff', fontWeight: '700' },
  featureSub: { fontSize: 11, color: '#998aaa' },
  methodRow: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 16 },
  methodBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,.15)',
  },
  methodBtnActive: { borderColor: '#FFD700', backgroundColor: 'rgba(255,215,0,.15)' },
  methodText: { color: '#998aaa', fontSize: 12, fontWeight: '700' },
  methodTextActive: { color: '#FFD700' },
  subscribeBtn: {
    width: '100%', backgroundColor: '#FFD700',
    borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12,
  },
  subscribeText: { color: '#000', fontSize: 16, fontWeight: '700' },
  disclaimer: { fontSize: 11, color: '#998aaa', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.7)', justifyContent: 'center', alignItems: 'center' },
  qrModal: { backgroundColor: '#1C0030', borderRadius: 20, padding: 24, width: '85%', borderWidth: 1, borderColor: 'rgba(255,45,120,.3)', alignItems: 'center' },
  qrTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 16 },
  qrSub: { color: '#998aaa', fontSize: 12, textAlign: 'center', marginBottom: 20 },
  qrBtn: { backgroundColor: '#FF2D78', borderRadius: 12, padding: 14, width: '100%', alignItems: 'center' },
  qrBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
})
