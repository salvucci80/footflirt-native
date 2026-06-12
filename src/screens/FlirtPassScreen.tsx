import React, { useState } from 'react'
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native'

interface Props {
  wallet: string
  onBack: () => void
}

const FEE_WALLET = 'AkBbqRjjLka9oeCnuXhNH5UqdjfzYoqeh7sh5gnrosP6'
const PRICE_SOL = 0.1

export default function FlirtPassScreen({ wallet, onBack }: Props) {
  const [buying, setBuying] = useState(false)
  const [active, setActive] = useState(false)

  async function subscribe() {
    setBuying(true)
    try {
      const { transact } = require('@solana-mobile/mobile-wallet-adapter-protocol-web3js')
      const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js')
      
      await transact(async (walletAdapter: any) => {
        const authResult = await walletAdapter.authorize({
          cluster: 'mainnet-beta',
          identity: { name: 'FootFlirt', uri: 'https://footflirt.app', icon: '/icon.png' }
        })
        
        const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=9e777985-1352-456c-8e9a-09b8d5d3ee52')
        const fromPubkey = new PublicKey(authResult.accounts[0].address)
        const toPubkey = new PublicKey(FEE_WALLET)
        
        const tx = new Transaction().add(
          SystemProgram.transfer({ fromPubkey, toPubkey, lamports: PRICE_SOL * LAMPORTS_PER_SOL })
        )
        const { blockhash } = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer = fromPubkey
        
        await walletAdapter.signAndSendTransactions({ transactions: [tx] })
        
        await fetch('https://footflirt.app/api/extras?action=flirtpass', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet_address: wallet, tx_signature: sig })
        })
        
        setActive(true)
        Alert.alert('FlirtPass activated! ðŸ’Ž')
      })
    } catch(e: any) {
      Alert.alert('Error', e?.message || 'Failed to subscribe')
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
        <Text style={styles.diamond}>ðŸ’Ž</Text>
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
              <Text style={styles.check}>âœ“</Text>
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080010' },
  backBtn: { padding: 16, paddingTop: 48 },
  backText: { color: '#fff', fontSize: 14 },
  content: { padding: 24, alignItems: 'center' },
  diamond: { fontSize: 48, marginBottom: 8 },
  title: { fontSize: 32, color: '#FFD700', fontWeight: '900', letterSpacing: 3, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#998aaa', textAlign: 'center', marginBottom: 24 },
  activeBadge: { backgroundColor: 'rgba(0,255,178,.15)', borderWidth: 1, borderColor: 'rgba(0,255,178,.3)', borderRadius: 16, padding: 12, marginBottom: 24 },
  activeText: { color: '#00FFB2', fontWeight: '700' },
  featuresCard: { width: '100%', backgroundColor: '#120020', borderRadius: 18, padding: 20, borderWidth: 1, borderColor: 'rgba(255,215,0,.2)', marginBottom: 24 },
  featuresTitle: { fontSize: 14, color: '#FFD700', fontWeight: '700', marginBottom: 12 },
  featureRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  check: { color: '#FFD700', fontSize: 16 },
  featureTitle: { fontSize: 13, color: '#fff', fontWeight: '700' },
  featureSub: { fontSize: 11, color: '#998aaa' },
  subscribeBtn: { width: '100%', backgroundColor: '#FFD700', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  subscribeText: { color: '#000', fontSize: 16, fontWeight: '700' },
  disclaimer: { fontSize: 11, color: '#998aaa', textAlign: 'center' },
})
