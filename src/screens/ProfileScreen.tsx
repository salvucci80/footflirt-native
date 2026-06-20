import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Share, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'

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
  const [avatarUrl, setAvatarUrl] = useState<string|null>(null)

  useEffect(() => {
    fetch('https://footflirt.app/api/extras?action=follow&wallet=' + wallet)
      .then(r => r.json())
      .then(data => { if (data.following) setIsFollowing(data.following.includes(username)) })
      .catch(() => {})
  }, [wallet, username])

  useEffect(() => {
  fetch('https://footflirt.app/api/profile?wallet=' + wallet)
    .then(r => r.json())
    .then(data => { if (data.avatar_url) setAvatarUrl(data.avatar_url) })
    .catch(() => {})
}, [wallet])

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
          ? userPosts.reduce((s: number, p: any) => s + (p.ai_score || 0), 0) / userPosts.length : 0
        const totalTips = userPosts.reduce((s: number, p: any) => s + (p.sol_tips_received || 0), 0)
        setStats({ totalPosts: userPosts.length, avgScore: parseFloat(avgScore.toFixed(1)), totalTips })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [username])

  async function uploadAvatar() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!perm.granted) return
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  })
  if (result.canceled) return
  try {
    const uri = result.assets[0].uri
    const timestamp = Date.now()
    const filename = `avatar-${wallet}-${timestamp}.jpg`
    const formData = new FormData()
    formData.append('file', { uri, name: filename, type: 'image/jpeg' } as any)
    await fetch(`https://twqobdqejgbffrlczleh.supabase.co/storage/v1/object/posts/${filename}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3cW9iZHFlamdiZmZybGN6bGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMDI0NDgsImV4cCI6MjA2MTg3ODQ0OH0.dBFQ8Gz2-KNRawTMPUMNcoN76WZFCoBGVGisPq4GZ2A`,
        'x-upsert': 'true',
      },
      body: formData,
    })
    const url = `https://twqobdqejgbffrlczleh.supabase.co/storage/v1/object/public/posts/${filename}`
    await fetch('https://footflirt.app/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_address: wallet, avatar_url: url })
    })
    setAvatarUrl(url)
  } catch(e) {
    Alert.alert('Failed to upload photo')
  }
}

  async function toggleFollow() {
    if (isFollowing) {
      await fetch('https://footflirt.app/api/extras?action=follow', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower_wallet: wallet, following_username: username })
      })
      setIsFollowing(false)
    } else {
      await fetch('https://footflirt.app/api/extras?action=follow', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ follower_wallet: wallet, following_username: username })
      })
      setIsFollowing(true)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{username}</Text>
        <TouchableOpacity onPress={()=>Share.share({message:`Check out ${username} on FootFlirt! https://footflirt.app`})}>
          <Ionicons name="share-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.profileTop}>
          <TouchableOpacity onPress={uploadAvatar} style={styles.avatarWrap}>
  {avatarUrl ? (
    <Image source={{uri: avatarUrl}} style={styles.avatarImg} />
  ) : (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{username.slice(1,3).toUpperCase()}</Text>
    </View>
  )}
  <View style={styles.avatarEdit}>
    <Ionicons name="camera" size={14} color="#fff" />
  </View>
</TouchableOpacity>
          <Text style={styles.username}>{username}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{stats.totalPosts}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, {color:'#FFD700'}]}>{stats.avgScore}</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, {color:'#00FFB2'}]}>{stats.totalTips}</Text>
              <Text style={styles.statLabel}>SOL Earned</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, {color:'#C800FF'}]}>{referralCount}</Text>
              <Text style={styles.statLabel}>Referrals</Text>
            </View>
          </View>

          {username !== '@anonymous' && (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followingBtn]}
              onPress={toggleFollow}
            >
              <Text style={[styles.followText, isFollowing && styles.followingText]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />

        {loading ? (
          <ActivityIndicator color="#FF2D78" style={{marginTop: 40}} />
        ) : posts.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 48,
    backgroundColor: '#0d0018',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,45,120,.2)',
  },
  headerTitle: { fontSize: 16, color: '#fff', fontWeight: '700' },
  profileTop: { alignItems: 'center', padding: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FF2D78',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3, borderColor: 'rgba(255,45,120,.3)',
  },
avatarWrap: { position: 'relative', marginBottom: 12 },
avatarImg: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: 'rgba(255,45,120,.3)' },
avatarEdit: {
  position: 'absolute', bottom: 0, right: 0,
  backgroundColor: '#FF2D78', borderRadius: 12,
  width: 24, height: 24, alignItems: 'center', justifyContent: 'center',
},
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  username: { fontSize: 22, color: '#fff', fontWeight: '700', marginBottom: 20 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, width: '100%', justifyContent: 'center' },
  stat: { alignItems: 'center', paddingHorizontal: 12 },
  statNum: { fontSize: 20, color: '#FF2D78', fontWeight: '900' },
  statLabel: { fontSize: 10, color: '#998aaa', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,.1)' },
  followBtn: {
    backgroundColor: '#FF2D78', borderRadius: 20,
    paddingHorizontal: 32, paddingVertical: 10,
  },
  followingBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FF2D78' },
  followText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  followingText: { color: '#FF2D78' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,.07)', marginHorizontal: 16 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#555', fontSize: 14, marginTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 2 },
  gridItem: { width: '33.33%', aspectRatio: 1, padding: 1, position: 'relative' },
  gridImage: { width: '100%', height: '100%' },
  gridScore: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,.7)', borderRadius: 6,
    paddingHorizontal: 4, paddingVertical: 2,
  },
  gridScoreText: { color: '#FFD700', fontSize: 10, fontWeight: '700' },
})