import React from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native'

interface Props {
  wallet: string
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

async function buyPack(pack: any) {
  Alert.alert('Buy ' + pack.name, 'Cost: ' + pack.price + ' SOL', [
    {text: 'Buy Now', onPress: () => processPurchase(pack)},
    {text: 'Cancel', style: 'cancel'},
  ])
}
async function processPurchase(pack: any) {
  try {
    const mwaModule = await import('@solana-mobile/mobile-wallet-adapter-protocol-web3js')
    const web3 = await import('@solana/web3.js')
    const { transact } = mwaModule
    const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = web3
    const amount = parseFloat(pack.price)

    await transact(async (walletAdapter: any) => {
      const authResult = await walletAdapter.reauthorize({
        auth_token: authToken,
        identity: { name: 'FootFlirt', uri: 'https://footflirt.app', icon: '/icon.png' }
      })

      const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=9e777985-1352-456c-8e9a-09b8d5d3ee52')
      const fromPubkey = new PublicKey(authResult.accounts[0].address)
      const FEE_WALLET = 'AkBbqRjjLka9oeCnuXhNH5UqdjfzYoqeh7sh5gnrosP6'
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
        body: JSON.stringify({ wallet_address: authResult.accounts[0].address, pack_id: pack.id, tx_signature: sig })
      })
      Alert.alert('Pack purchased!', pack.name + ' is now in your collection!')
    })
  } catch(e: any) {
    Alert.alert('Purchase Error', String(e?.message || e))
  }
}

export default function ShopScreen({ wallet }: Props) {
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
})
