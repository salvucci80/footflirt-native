import React from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native'

interface Props {
  wallet: string
}

const PACKS = [
  { id:'starter', name:'Drip Starter', color:'#00FFB2', price:null, owned:true },
  { id:'queen', name:'Queen Mode', color:'#FFD700', price:'0.03 SOL', owned:false },
  { id:'celestial', name:'Celestial', color:'#C800FF', price:'0.03 SOL', owned:false },
  { id:'street', name:'Street Heat', color:'#FF2D78', price:'0.01 SOL', owned:false },
  { id:'luxe', name:'Luxe Drip', color:'#ff9500', price:'0.05 SOL', owned:false },
  { id:'wild', name:'Wild Side', color:'#00FFB2', price:'0.01 SOL', owned:false },
]

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
          <View style={styles.cardFooter}>
            <Text style={[styles.price, {color: pack.owned ? '#00FFB2' : '#FFD700'}]}>
              {pack.owned ? 'Free' : pack.price}
            </Text>
            {!pack.owned && (
              <TouchableOpacity style={styles.buyBtn}>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
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