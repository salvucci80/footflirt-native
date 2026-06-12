import React, { useState } from 'react'
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import FeedScreen from './FeedScreen'
import SubmitScreen from './SubmitScreen'
import ShopScreen from './ShopScreen'
import LeaderboardScreen from './LeaderboardScreen'
import FlirtPassScreen from './FlirtPassScreen'
import ProfileScreen from './ProfileScreen'

interface Props {
  wallet: string
  onDisconnect: () => void
}

export default function MainApp({ wallet, onDisconnect }: Props) {
  const [tab, setTab] = useState<'feed'|'submit'|'shop'|'leaderboard'>('feed')
  const [showFlirtPass, setShowFlirtPass] = useState(false)
  const [viewProfile, setViewProfile] = useState<string|null>(null)

  if (showFlirtPass) {
    return <FlirtPassScreen wallet={wallet} onBack={()=>setShowFlirtPass(false)} />
  }

  if (viewProfile) {
    return <ProfileScreen username={viewProfile} wallet={wallet} onBack={()=>setViewProfile(null)} />
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>FOOTFLIRT</Text>
        <View style={styles.headerRight}>
          <View style={styles.walletBadge}>
            <TouchableOpacity style={styles.profileBtn} onPress={()=>setViewProfile(wallet)}>
  <Text style={styles.profileBtnText}>Me</Text>
</TouchableOpacity>
            <Text style={styles.walletText}>{wallet.slice(0,4)}...{wallet.slice(-4)}</Text>
          </View>
          <TouchableOpacity style={styles.outBtn} onPress={onDisconnect}>
            <Text style={styles.outText}>Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.main}>
        {tab === 'feed' && <FeedScreen wallet={wallet} onViewProfile={setViewProfile} />}
        {tab === 'submit' && <SubmitScreen wallet={wallet} onPost={()=>setTab('feed')} />}
        {tab === 'shop' && <ShopScreen wallet={wallet} />}
        {tab === 'leaderboard' && <LeaderboardScreen onViewProfile={setViewProfile} />}
      </View>

      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={()=>setTab('feed')}>
          <Ionicons name="flame" size={24} color={tab==='feed' ? '#FF2D78' : '#555'} />
          <Text style={[styles.navLabel, tab==='feed' && styles.navActive]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={()=>setTab('submit')}>
          <View style={styles.fab}>
            <Ionicons name="camera" size={26} color="#fff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={()=>setTab('shop')}>
          <Ionicons name="bag" size={24} color={tab==='shop' ? '#FF2D78' : '#555'} />
          <Text style={[styles.navLabel, tab==='shop' && styles.navActive]}>Shop</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={()=>setTab('leaderboard')}>
          <Ionicons name="trophy" size={24} color={tab==='leaderboard' ? '#FF2D78' : '#555'} />
          <Text style={[styles.navLabel, tab==='leaderboard' && styles.navActive]}>Top</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={()=>setShowFlirtPass(true)}>
          <Ionicons name="diamond" size={24} color={showFlirtPass ? '#FFD700' : '#555'} />
          <Text style={styles.navLabel}>Pass</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080010' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 48,
    backgroundColor: '#0d0018',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,45,120,.2)',
  },
  logo: { fontSize: 20, color: '#FF2D78', fontWeight: '900', letterSpacing: 3 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletBadge: {
    backgroundColor: 'rgba(0,255,178,.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,178,.4)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  walletText: { color: '#00FFB2', fontSize: 11, fontWeight: '700' },
  outBtn: {
    backgroundColor: 'rgba(255,45,120,.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,45,120,.3)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  outText: { color: '#FF2D78', fontSize: 11, fontWeight: '700' },
  main: { flex: 1 },
  nav: {
    flexDirection: 'row',
    backgroundColor: '#0d0018',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,45,120,.2)',
    paddingBottom: 24,
    paddingTop: 8,
  },
  navBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 10, color: '#555', marginTop: 2 },
  navActive: { color: '#FF2D78' },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FF2D78',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  profileBtn: {
  backgroundColor: 'rgba(200,0,255,.15)',
  borderWidth: 1,
  borderColor: 'rgba(200,0,255,.3)',
  borderRadius: 20,
  paddingHorizontal: 10,
  paddingVertical: 5,
},
profileBtnText: { color: '#C800FF', fontSize: 11, fontWeight: '700' },
})