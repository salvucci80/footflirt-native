import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'

const FEET_URL = 'https://twqobdqejgbffrlczleh.supabase.co/storage/v1/object/public/posts/feet%20v.png'
const MEDALS = ['🥇','🥈','🥉']

export default function LeaderboardScreen() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'score'|'votes'|'tips'>('score')

  useEffect(() => {
    fetch('https://footflirt.app/api/feed?sort=top&offset=0&limit=50')
      .then(r => r.json())
      .then(data => setPosts(data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const sorted = [...posts].sort((a, b) => {
    if (tab === 'score') return (b.ai_score || 0) - (a.ai_score || 0)
    if (tab === 'votes') return (b.community_votes || 0) - (a.community_votes || 0)
    return (b.sol_tips_received || 0) - (a.sol_tips_received || 0)
  }).slice(0, 10)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>
      <View style={styles.tabs}>
        {(['score','votes','tips'] as const).map(t => (
          <TouchableOpacity key={t} onPress={()=>setTab(t)} style={[styles.tab, tab===t && styles.activeTab]}>
            <Text style={[styles.tabText, tab===t && styles.activeTabText]}>
              {t === 'score' ? 'AI Score' : t === 'votes' ? 'Most Voted' : 'Most Tipped'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF2D78" style={{marginTop:40}} />
      ) : (
        <ScrollView contentContainerStyle={{padding:14}}>
          {sorted.map((post, idx) => (
            <View key={post.id} style={[styles.row, idx===0 && styles.gold, idx===1 && styles.silver, idx===2 && styles.bronze]}>
              <Text style={styles.medal}>{MEDALS[idx] || `#${idx+1}`}</Text>
              <Image
                source={{uri: post.image_url === 'mock' ? FEET_URL : post.image_url}}
                style={styles.thumb}
              />
              <View style={styles.info}>
                <Text style={styles.username}>{post.username || '@anonymous'}</Text>
                <Text style={styles.caption} numberOfLines={1}>{post.caption || 'No caption'}</Text>
              </View>
              <View style={styles.stat}>
                {tab === 'score' && <Text style={styles.statNum}>{post.ai_score}</Text>}
                {tab === 'votes' && <Text style={styles.statNum}>{post.community_votes}</Text>}
                {tab === 'tips' && <Text style={styles.statNum}>{post.sol_tips_received}</Text>}
                <Text style={styles.statLabel}>
                  {tab === 'score' ? '/10' : tab === 'votes' ? 'votes' : 'SOL'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080010' },
  title: { fontSize: 26, color: '#FFD700', fontWeight: '900', letterSpacing: 3, padding: 16 },
  tabs: { flexDirection: 'row', paddingHorizontal: 14, gap: 8, marginBottom: 8 },
  tab: {
    flex: 1, padding: 8, borderRadius: 10, alignItems: 'center',
    backgroundColor: '#120020', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)',
  },
  activeTab: { backgroundColor: '#FF2D78', borderColor: '#FF2D78' },
  tabText: { color: '#998aaa', fontSize: 11, fontWeight: '700' },
  activeTabText: { color: '#fff' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#120020', borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,.07)',
  },
  gold: { borderColor: 'rgba(255,215,0,.3)' },
  silver: { borderColor: 'rgba(192,192,192,.2)' },
  bronze: { borderColor: 'rgba(205,127,50,.2)' },
  medal: { fontSize: 24, width: 32, textAlign: 'center' },
  thumb: { width: 52, height: 52, borderRadius: 10 },
  info: { flex: 1 },
  username: { color: '#FF2D78', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  caption: { color: '#998aaa', fontSize: 11 },
  stat: { alignItems: 'flex-end' },
  statNum: { color: '#FFD700', fontSize: 18, fontWeight: '900' },
  statLabel: { color: '#998aaa', fontSize: 10 },
})