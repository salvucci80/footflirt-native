import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'

interface Props {
  username: string
  wallet: string
  onBack: () => void
}

const FEET_URL = 'https://twqobdqejgbffrlczleh.supabase.co/storage/v1/object/public/posts/feet%20v.png'

export default function ProfileScreen({ username, wallet, onBack }: Props) {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ totalPosts: 0, avgScore: 0, totalTips: 0 })
  const [isFollowing, setIsFollowing] = useState(false)
  const [referralCount, setReferralCount] = useState(0)

  useEffect(() => {
    fetch('https://footflirt.app/api/extras?action=follow&wallet=' + wallet)
      .then(r => r.json())
      .then(data => {
        if (data.following) setIsFollowing(data.following.includes(username))
      })
      .catch(() => {})
  }, [wallet, username])

  useEffect(() => {
    fetch('https://footflirt.app/api/extras?action=referral&username=' + encodeURIComponent(username))
      .then(r => r.json())
      .then(data => setReferralCount(data.count || 0))
      .catch(() => {})
  }, [username])

  useEffect(() => {
    fetch('https://footflirt.app/api/feed?sort=top&offset=0&limit=100')
      .then(r => r.json())
      .then(data => {
        const userPosts = (data.posts || []).filter((p: any) => p.username === username)
        setPosts(userPosts)
        const avgScore = userPosts.length > 0
          ? userPosts.reduce((s: number, p: any) => s + (p.ai_score || 0), 0) / userPosts.length
          : 0
        const totalTips = userPosts.reduce((s: number, p: any) => s + (p.sol_tips_received || 0), 0)
        setStats({ totalPosts: userPosts.length, avgScore: parseFloat(avgScore.toFixed(1)), totalTips })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [username])

  async function toggleFollow() {
    if (isFollowing) {
      await fetch('https://footflirt.app/api/extras?action=follow', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower_wallet: wallet, following_username: username })
      })
      setIsFollowing(false)
    } else {
      await fetch('https://footflirt.app/api/extras?action=follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower_wallet: wallet, following_username: username })
      })
      setIsFollowing(true)
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{paddingBottom: 20}}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Text style={styles.username}>{username}</Text>
            {username !== '@anonymous' && (
              <TouchableOpacity style={[styles.followBtn, isFollowing && styles.followingBtn]} onPress={toggleFollow}>
                <Text style={[styles.followText, isFollowing && styles.followingText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, {color:'#FF2D78'}]}>{stats.totalPosts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, {color:'#FFD700'}]}>{stats.avgScore}</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, {color:'#00FFB2'}]}>{stats.totalTips}</Text>
              <Text style={styles.statLabel}>Tips SOL</Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statNum, {color:'#C800FF'}]}>{referralCount}</Text>
              <Text style={styles.statLabel}>Referrals</Text>
            </View>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color="#FF2D78" style={{marginTop: 40}} />
        ) : posts.length === 0 ? (
          <Text style={styles.empty}>No posts yet</Text>
        ) : (
          <View style={styles.grid}>
            {posts.map(post => (
              <View key={post.id} style={styles.gridItem}>
                <Image
                  source={{uri: post.image_url === 'mock' ? FEET_URL : post.image_url}}
                  style={styles.gridImage}
                />
                <View style={styles.gridScore}>
                  <Text style={styles.gridScoreText}>{post.ai_score}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080010' },
  backBtn: { padding: 16, paddingTop: 48 },
  backText: { color: '#fff', fontSize: 14 },
  profileCard: {
    margin: 14, backgroundColor: '#120020', borderRadius: 18,
    padding: 16, borderWidth: 1, borderColor: 'rgba(255,45,120,.2)',
  },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  username: { fontSize: 22, color: '#fff', fontWeight: '700' },
  followBtn: {
    backgroundColor: '#FF2D78', borderRadius: 20,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  followingBtn: { backgroundColor: 'rgba(255,45,120,.15)', borderWidth: 1, borderColor: 'rgba(255,45,120,.3)' },
  followText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  followingText: { color: '#FF2D78' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: '900' },
  statLabel: { fontSize: 11, color: '#998aaa', marginTop: 2 },
  empty: { color: '#998aaa', textAlign: 'center', padding: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 4 },
  gridItem: { width: '48%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  gridImage: { width: '100%', height: '100%' },
  gridScore: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,.7)', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  gridScoreText: { color: '#FFD700', fontSize: 11, fontWeight: '700' },
})