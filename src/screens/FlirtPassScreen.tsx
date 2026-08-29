import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Modal, Linking } from 'react-native'
import { showAlert } from './CustomAlert'
import { FEE_WALLET, createConnection, withWalletTransaction, walletPubkeyFromAuth } from '../lib/solanaWallet'

interface Props {
  wallet: string
  authToken: string
  onBack: () => void
}

const PRICE_SOL = 0.1

export default function FlirtPassScreen({ wallet, authToken, onBack }: Props) {
  const [buying, setBuying] = useState(false)
  const [active, setActive] = useState(false)
  const [payModal, setPayModal] = useState(false)

  async function subscribe() {
  setBuying(true)
  if (wallet.startsWith('email:')) {
    setPayModal(true)
    setBuying(false)
    return
  }
  try {
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
        body: JSON.stringify({ wallet_address: wallet, tx_signature: sig })
      })
      setActive(true)
      showAlert('FlirtPass activated!')
    })
  } catch(e: any) {
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
          <TouchableOpacity style={styles.subscribeBtn} onPress={subscribe} disabled={buying}>
            {buying ? <ActivityIndicator color="#000" /> : <Text style={styles.subscribeText}>Subscribe for {PRICE_SOL} SOL/month</Text>}
          </TouchableOpacity>
        )}

        <Text style={styles.disclaimer}>Renews monthly. Cancel anytime by not renewing.</Text>
      </ScrollView>

      <Modal visible={payModal} transparent animationType="fade" onRequestClose={() => setPayModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <Text style={styles.qrTitle}>💸 Pay with Wallet</Text>
            <Text style={styles.qrSub}>Open your Solana wallet to pay {PRICE_SOL} SOL for FlirtPass</Text>
          <TouchableOpacity style={styles.qrBtn} onPress={() => { Linking.openURL(`solana:${FEE_WALLET}?amount=${PRICE_SOL}&label=FlirtPass`); setPayModal(false) }}>
  <Text style={styles.qrBtnText}>Open Wallet</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.qrBtn, {backgroundColor:'rgba(255,255,255,.08)', marginTop: 8}]} onPress={() => setPayModal(false)}>
  <Text style={[styles.qrBtnText, {color:'#fff'}]}>Cancel</Text>
</TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
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
