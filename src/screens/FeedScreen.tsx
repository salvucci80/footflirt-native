import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'

interface Props {
  wallet: string
}

const FEET_URL = 'https://twqobdqejgbffrlczleh.supabase.co/storage/v1/object/public/posts/feet%20v.png'
const CAT_COLORS = ['#FF2D78','#C800FF','#00FFB2','#FFD700','#ff9500']
const CAT_LABELS = ['Nail Art','Shape & Arch','Softness','Vibe','Shoe Pairing']
const CATS = ['nail_art','shape_arch','softness','vibe','shoe_pairing']

export default function FeedScreen({ wallet }: Props) {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://footflirt.app/api/feed?sort=top&offset=0&limit=20')
      .then(r => r.json())
      .then(data => setPosts(data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#FF2D78" />
    </View>
  )

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 20}}>
      {posts.map((post, idx) => {
        const bd = post.score_breakdown || {}
        return (
          <View key={post.id} style={styles.card}>
            <View style={styles.imageContainer}>
              <Image
                source={{uri: post.image_url === 'mock' ? FEET_URL : post.image_url}}
                style={styles.image}
                resizeMode="cover"
              />
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{idx+1} TODAY</Text>
              </View>
              <View style={styles.scoreBubble}>
                <Text style={styles.scoreNum}>{post.ai_score}</Text>
                <Text style={styles.scoreDen}>/10</Text>
              </View>
              <View style={styles.judgeTag}>
                <Text style={styles.judgeText}>⚖️ AI Judge</Text>
              </View>
            </View>

            <View style={styles.body}>
              <View style={styles.userRow}>
                <Text style={styles.username}>{post.username || '@anonymous'}</Text>
                <TouchableOpacity style={styles.tipBtn}>
                  <Text style={styles.tipText}>⚡ Tip</Text>
                </TouchableOpacity>
              </View>

              {post.caption ? <Text style={styles.caption}>{post.caption}</Text> : null}

              {CATS.map((cat, i) => (
                <View key={cat} style={styles.catRow}>
                  <Text style={styles.catLabel}>{CAT_LABELS[i]}</Text>
                  <View style={styles.catBarWrap}>
                    <View style={[styles.catBar, {width: `${(bd[cat]||0)*10}%` as any, backgroundColor: CAT_COLORS[i]}]} />
                  </View>
                  <Text style={[styles.catVal, {color: CAT_COLORS[i]}]}>{bd[cat] || 0}</Text>
                </View>
              ))}

              {bd.verdict ? <Text style={styles.verdict}>"{bd.verdict}"</Text> : null}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.actBtn}>
                  <Text style={styles.actText}>🤍 Fire</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actBtn}>
                  <Text style={styles.actText}>💬 Comment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actBtn}>
                  <Text style={styles.actText}>📤 Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080010' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080010' },
  card: {
    margin: 10,
    backgroundColor: '#120020',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,45,120,.12)',
  },
  imageContainer: { position: 'relative', height: 220 },
  image: { width: '100%', height: '100%' },
  rankBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,.7)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  rankText: { color: '#FFD700', fontSize: 10, fontWeight: '800' },
  scoreBubble: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,.8)',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'baseline',
  },
  scoreNum: { color: '#FFD700', fontSize: 22, fontWeight: '900' },
  scoreDen: { color: '#998aaa', fontSize: 12 },
  judgeTag: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,.7)',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(0,255,178,.4)',
  },
  judgeText: { color: '#00FFB2', fontSize: 10 },
  body: { padding: 14 },
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  username: { color: '#fff', fontSize: 14, fontWeight: '700' },
  tipBtn: {
    backgroundColor: '#FFD700',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
  },
  tipText: { color: '#000', fontSize: 12, fontWeight: '700' },
  caption: { color: '#ccc', fontSize: 13, marginBottom: 10 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  catLabel: { color: '#998aaa', fontSize: 10, width: 80 },
  catBarWrap: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,.1)', borderRadius: 2, marginHorizontal: 6 },
  catBar: { height: 4, borderRadius: 2 },
  catVal: { fontSize: 11, fontWeight: '700', width: 28, textAlign: 'right' },
  verdict: { color: '#998aaa', fontSize: 11, fontStyle: 'italic', marginTop: 8, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,.05)',
    borderRadius: 8, padding: 8, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,.08)',
  },
  actText: { color: '#998aaa', fontSize: 11 },
})