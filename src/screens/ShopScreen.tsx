import React, { useState } from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Modal, Linking } from 'react-native'
import { showAlert } from './CustomAlert'
import { FEE_WALLET, createConnection, withWalletTransaction, walletPubkeyFromAuth } from '../lib/solanaWallet'

interface Props {
  wallet: string
  authToken: string
}

const BASE_URL = 'https://footflirt.app/'

const PACKS = [
  { id:'starter', name:'Drip Starter', color:'#00FFB2', price:null, owned:true,
    images:['startera','starterb','starterc','starterd','startere','starterf'] },
  { id:'queen', name:'Queen Mode', color:'#FFD700', price:'0.03', owned:false,
    images:['queena','queenb','queenc','queend','queene','queenf'] },
  { id:'celestial', name:'Celestial', color:'#C800FF', price:'0.03', owned:false,
    images:['celestiala','celestialb','celestialc','celestiald','celestiale','celestialf'] },
  { id:'street', name:'Street Heat', color:'#FF2D78', price:'0.01', owned:false,
    images:['streeta','streetb','streetc','streetd','streete','streetf'] },
  { id:'luxe', name:'Luxe Drip', color:'#ff9500', price:'0.05', owned:false,
    images:['luxea','luxeb','luxec','luxed','luxee','luxef'] },
  { id:'wild', name:'Wild Side', color:'#00FFB2', price:'0.01', owned:false,
    images:['wilda','wildb','wildc','wildd','wilde','wildf'] },
]

export default function ShopScreen({ wallet, authToken }: Props) {
  const [payModal, setPayModal] = useState<{url: string, amount: number}|null>(null)

  async function processPurchase(pack: any) {
    const amount = parseFloat(pack.price)
    if (wallet.startsWith('email:')) {
      const solanaUrl = `solana:${FEE_WALLET}?amount=${amount}&label=${encodeURIComponent('FootFlirt – ' + pack.name)}`
      setPayModal({ url: solanaUrl, amount })
      return
    }
    try {
      await withWalletTransaction(authToken, async ({ walletAdapter, authResult, PublicKey, Connection, Transaction, SystemProgram, LAMPORTS_PER_SOL }) => {
        const connection = createConnection(Connection)
        const fromPubkey = walletPubkeyFromAuth(authResult, PublicKey)
        const tx = new Transaction().add(
          SystemProgram.transfer({ fromPubkey, toPubkey: new PublicKey(FEE_WALLET), lamports: amount * LAMPORTS_PER_SOL })
        )
        const { blockhash } = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer = fromPubkey
        const signedTxs = await walletAdapter.signTransactions({ transactions: [tx] })
        const sig = await connection.sendRawTransaction(signedTxs[0].serialize())
        await connection.confirmTransaction(sig)
        await fetch('https://footflirt.app/api/purchase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet_address: wallet, pack_id: pack.id, tx_signature: sig })
        })
        showAlert('Pack purchased!', pack.name + ' is now in your collection!')
      })
    } catch(e: any) {
      showAlert('Purchase Error', String(e?.message || e))
    }
  }

  function buyPack(pack: any) {
    showAlert('Buy ' + pack.name, 'Cost: ' + pack.price + ' SOL', [
      {text: 'Buy Now', onPress: () => processPurchase(pack)},
      {text: 'Cancel', style: 'cancel'},
    ])
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom:20}}>
      <Text style={styles.title}>Sticker Shop</Text>
      {PACKS.map(pack => (
        <View key={pack.id} style={[styles.card, pack.owned && styles.ownedCard]}>
          <View style={styles.cardHeader}>
            <View>
              <Text style={[styles.packName, {color: pack.color}]}>{pack.name}</Text>
              <Text style={styles.packDesc}>{pack.owned ? 'In your collection' : 'Premium sticker pack'}</Text>
            </View>
            <View style={[styles.badge, pack.owned ? styles.ownedBadge : styles.premiumBadge]}>
              <Text style={[styles.badgeText, pack.owned ? styles.ownedText : styles.premiumText]}>
                {pack.owned ? 'OWNED' : 'PREMIUM'}
              </Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginVertical:10}}>
            {pack.images.map((img, i) => (
              <Image
                key={img}
                source={{uri: BASE_URL + img + '.png'}}
                style={{width:60,height:60,borderRadius:10,marginRight:6,opacity:pack.owned || i < 2 ? 1 : 0.3}}
              />
            ))}
          </ScrollView>

          <View style={styles.cardFooter}>
            <Text style={[styles.price, {color: pack.owned ? '#00FFB2' : '#FFD700'}]}>
              {pack.owned ? 'Free' : pack.price + ' SOL'}
            </Text>
            {!pack.owned && (
              <TouchableOpacity style={styles.buyBtn} onPress={()=>buyPack(pack)}>
                <Text style={styles.buyText}>Buy Pack</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}
      <Modal visible={!!payModal} transparent animationType="fade" onRequestClose={() => setPayModal(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <Text style={styles.qrTitle}>💸 Pay with Wallet</Text>
            <Text style={styles.qrSub}>Open your Solana wallet to pay {payModal?.amount} SOL</Text>
            <TouchableOpacity style={styles.qrBtn} onPress={() => { Linking.openURL(payModal!.url); setPayModal(null) }}>
              <Text style={styles.qrBtnText}>Open Phantom</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.qrBtn, {backgroundColor:'#C800FF', marginTop: 8}]} onPress={() => { Linking.openURL(payModal!.url.replace('solana:', 'solflare:')); setPayModal(null) }}>
              <Text style={styles.qrBtnText}>Open Solflare</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.qrBtn, {backgroundColor:'rgba(255,255,255,.08)', marginTop: 8}]} onPress={() => setPayModal(null)}>
              <Text style={[styles.qrBtnText, {color:'#998aaa'}]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080010' },
  title: { fontSize: 26, color: '#FFD700', fontWeight: '900', letterSpacing: 3, padding: 16 },
  card: {
    margin: 10, marginTop: 0, backgroundColor: '#120020',
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,.07)',
  },
  ownedCard: { borderColor: 'rgba(0,255,178,.25)' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  packName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  packDesc: { fontSize: 11, color: '#998aaa' },
  badge: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  ownedBadge: { backgroundColor: 'rgba(0,255,178,.15)', borderColor: 'rgba(0,255,178,.3)' },
  premiumBadge: { backgroundColor: 'rgba(255,45,120,.15)', borderColor: 'rgba(255,45,120,.3)' },
  badgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  ownedText: { color: '#00FFB2' },
  premiumText: { color: '#FF2D78' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 15, fontWeight: '700' },
  buyBtn: { backgroundColor: '#FF2D78', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  buyText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.7)', justifyContent: 'center', alignItems: 'center' },
  qrModal: { backgroundColor: '#1C0030', borderRadius: 20, padding: 24, width: '85%', borderWidth: 1, borderColor: 'rgba(255,45,120,.3)', alignItems: 'center' },
  qrTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 16 },
  qrSub: { color: '#998aaa', fontSize: 12, textAlign: 'center', marginBottom: 20 },
  qrBtn: { backgroundColor: '#FF2D78', borderRadius: 12, padding: 14, width: '100%', alignItems: 'center' },
  qrBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
})