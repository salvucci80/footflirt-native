import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Alert, Share } from 'react-native'

interface Props {
  wallet: string
  onViewProfile: (username: string) => void
}

const FEET_URL = 'https://twqobdqejgbffrlczleh.supabase.co/storage/v1/object/public/posts/feet%20v.png'
const CAT_COLORS = ['#FF2D78','#C800FF','#00FFB2','#FFD700','#ff9500']
const CAT_LABELS = ['Nail Art','Shape & Arch','Softness','Vibe','Shoe Pairing']
const CATS = ['nail_art','shape_arch','softness','vibe','shoe_pairing']
const BASE_URL = 'https://footflirt.app/'
const STARTER_STICKERS = ['startera.png','starterb.png','starterc.png','starterd.png','startere.png','starterf.png']

export default function FeedScreen({ wallet, onViewProfile }: Props) {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [commentPost, setCommentPost] = useState<string|null>(null)
  const [commentText, setCommentText] = useState('')
  const [commentName, setCommentName] = useState('')
  const [comments, setComments] = useState<Record<string,any[]>>({})
  const [stickerPost, setStickerPost] = useState<string|null>(null)
  const [placedStickers, setPlacedStickers] = useState<Record<string,string[]>>({})
  const [votes, setVotes] = useState<Record<string,number>>({})

  useEffect(() => {
    fetch('https://footflirt.app/api/feed?sort=top&offset=0&limit=20')
      .then(r => r.json())
      .then(data => setPosts(data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function loadComments(postId: string) {
    const res = await fetch(`https://footflirt.app/api/posts/${postId}/comments`)
    const data = await res.json()
    setComments(prev => ({...prev, [postId]: data.comments || []}))
  }

  async function submitComment(postId: string) {
    if (!commentText.trim() || !commentName.trim()) return
    await fetch(`https://footflirt.app/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({username: commentName, content: commentText})
    })
    setCommentText('')
    loadComments(postId)
  }

  async function reportPost(postId: string) {
    Alert.alert('Report Post', 'Why are you reporting this?', [
      {text: 'Nudity', onPress: () => sendReport(postId, 'Nudity')},
      {text: 'Spam', onPress: () => sendReport(postId, 'Spam')},
      {text: 'Inappropriate', onPress: () => sendReport(postId, 'Inappropriate')},
      {text: 'Cancel', style: 'cancel'},
    ])
  }

  async function sendReport(postId: string, reason: string) {
    try {
      await fetch('https://footflirt.app/api/report', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({post_id: postId, reason})
      })
      Alert.alert('Reported', 'Thank you for your report.', [{text: 'OK'}])
    } catch(e) {
      Alert.alert('Error', 'Failed to report.')
    }
  }

  async function votePost(postId: string, stars: number) {
    setVotes(v => ({...v, [postId]: stars}))
    await fetch(`https://footflirt.app/api/posts/${postId}/vote`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({stars})
    })
  }

  function tipUser(post: any): void {
    Alert.alert('Tip', 'How much SOL would you like to tip?', [
      {text: '0.01 SOL', onPress: () => sendTip(post, 0.01)},
      {text: '0.05 SOL', onPress: () => sendTip(post, 0.05)},
      {text: '0.1 SOL', onPress: () => sendTip(post, 0.1)},
      {text: 'Cancel', style: 'cancel'},
    ])
  }

  async function sendTip(post: any, amount: number) {
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
        const FEE_WALLET = 'AkBbqRjjLka9oeCnuXhNH5UqdjfzYoqeh7sh5gnrosP6'

        const feeAmount = Math.floor(amount * LAMPORTS_PER_SOL * 0.05)
        const tipAmount = Math.floor(amount * LAMPORTS_PER_SOL * 0.95)

        const tx = new Transaction()

        if (post.wallet_address) {
          tx.add(SystemProgram.transfer({
            fromPubkey,
            toPubkey: new PublicKey(post.wallet_address),
            lamports: tipAmount
          }))
        }

        tx.add(SystemProgram.transfer({
          fromPubkey,
          toPubkey: new PublicKey(FEE_WALLET),
          lamports: feeAmount
        }))

        const { blockhash } = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer = fromPubkey

        const result = await walletAdapter.signAndSendTransactions({ transactions: [tx] })

        Alert.alert('Tip sent!', `${amount} SOL sent successfully!`)
      })
    } catch(e: any) {
      Alert.alert('Error', e?.message || 'Failed to send tip')
    }
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#FF2D78" />
    </View>
  )

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom:20}}>
      {posts.map((post, idx) => {
        const bd = post.score_breakdown || {}
        const myVote = votes[post.id] ?? 0

        function tipUser(post: any): void {
          throw new Error('Function not implemented.')
        }

        return (
          <View key={post.id} style={styles.card}>
            <View style={styles.imageContainer}>
              <Image
                source={{uri: post.image_url === 'mock' ? FEET_URL : post.image_url}}
                style={styles.image}
                resizeMode="cover"
              />
              {post.is_featured && (
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredText}>FEATURED</Text>
                </View>
              )}
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{idx+1} TODAY</Text>
              </View>
              <View style={styles.scoreBubble}>
                <Text style={styles.scoreNum}>{post.ai_score}</Text>
                <Text style={styles.scoreDen}>/10</Text>
              </View>
              <View style={styles.judgeTag}>
                <Text style={styles.judgeText}>AI Judge</Text>
              </View>
              {(placedStickers[post.id]||[]).map((img, i) => (
                <Image
                  key={i}
                  source={{uri: BASE_URL + img}}
                  style={{position:'absolute', bottom:40+(i*55), left:10+(i*30), width:60, height:60}}
                />
              ))}
            </View>

            <View style={styles.body}>
              <View style={styles.userRow}>
                <TouchableOpacity onPress={()=>onViewProfile(post.username || '@anonymous')}>
                  <Text style={styles.username}>{post.username || '@anonymous'}</Text>
                </TouchableOpacity>
<TouchableOpacity style={styles.tipBtn} onPress={()=>tipUser(post)}>
  <Text style={styles.tipText}>ðŸ’° Tip</Text>
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

              <View style={styles.voteRow}>
                <Text style={styles.voteLabel}>Rate:</Text>
                {[1,2,3,4,5].map(s => (
                  <TouchableOpacity key={s} onPress={() => votePost(post.id, s)}>
                    <Text style={[styles.star, myVote >= s && styles.starLit]}>â˜…</Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.voteCount}>{post.community_votes} votes</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity style={styles.actBtn} onPress={()=>{setCommentPost(commentPost===post.id?null:post.id);loadComments(post.id)}}>
                  <Text style={styles.actText}>Comment</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actBtn} onPress={()=>Share.share({message:'Check out FootFlirt! https://footflirt.app'})}>
                  <Text style={styles.actText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actBtn} onPress={()=>reportPost(post.id)}>
                  <Text style={styles.actText}>Report</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.stickerToggle} onPress={()=>setStickerPost(stickerPost===post.id?null:post.id)}>
                <Text style={styles.stickerToggleText}>Drop a Sticker</Text>
              </TouchableOpacity>

              {stickerPost === post.id && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop:8}}>
                  {STARTER_STICKERS.map(img => (
                    <TouchableOpacity key={img} onPress={()=>{
                      setPlacedStickers(prev => ({
                        ...prev,
                        [post.id]: [...(prev[post.id]||[]), img]
                      }))
                      setStickerPost(null)
                    }}>
                      <Image source={{uri: BASE_URL + img}} style={{width:56,height:56,borderRadius:8,marginRight:6}} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {commentPost === post.id && (
                <View style={styles.commentBox}>
                  {(comments[post.id]||[]).map((c:any,i:number)=>(
                    <View key={i} style={styles.commentItem}>
                      <Text style={styles.commentUser}>{c.username}</Text>
                      <Text style={styles.commentContent}>{c.content}</Text>
                    </View>
                  ))}
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Your name..."
                    placeholderTextColor="#998aaa"
                    value={commentName}
                    onChangeText={setCommentName}
                  />
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Add a comment..."
                    placeholderTextColor="#998aaa"
                    value={commentText}
                    onChangeText={setCommentText}
                  />
                  <TouchableOpacity style={styles.commentSubmit} onPress={()=>submitComment(post.id)}>
                    <Text style={styles.commentSubmitText}>Post Comment</Text>
                  </TouchableOpacity>
                </View>
              )}
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
    margin: 10, backgroundColor: '#120020', borderRadius: 18,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,45,120,.12)',
  },
  imageContainer: { position: 'relative', height: 220 },
  image: { width: '100%', height: '100%' },
  featuredBadge: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: '#FFD700', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  featuredText: { color: '#000', fontSize: 10, fontWeight: '800' },
  rankBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,.7)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  rankText: { color: '#FFD700', fontSize: 10, fontWeight: '800' },
  scoreBubble: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,.8)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 6,
    flexDirection: 'row', alignItems: 'baseline',
  },
  scoreNum: { color: '#FFD700', fontSize: 22, fontWeight: '900' },
  scoreDen: { color: '#998aaa', fontSize: 12 },
  judgeTag: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,.7)', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(0,255,178,.4)',
  },
  judgeText: { color: '#00FFB2', fontSize: 10 },
  body: { padding: 14 },
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  username: { color: '#FF2D78', fontSize: 14, fontWeight: '700' },
  tipBtn: { backgroundColor: '#FFD700', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  tipText: { color: '#000', fontSize: 12, fontWeight: '700' },
  caption: { color: '#ccc', fontSize: 13, marginBottom: 10 },
  catRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  catLabel: { color: '#998aaa', fontSize: 10, width: 80 },
  catBarWrap: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,.1)', borderRadius: 2, marginHorizontal: 6 },
  catBar: { height: 4, borderRadius: 2 },
  catVal: { fontSize: 11, fontWeight: '700', width: 28, textAlign: 'right' },
  verdict: { color: '#998aaa', fontSize: 11, fontStyle: 'italic', marginTop: 8, marginBottom: 8 },
  voteRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  voteLabel: { color: '#998aaa', fontSize: 11, marginRight: 4 },
  star: { fontSize: 20, color: '#333' },
  starLit: { color: '#FFD700' },
  voteCount: { color: '#998aaa', fontSize: 11, marginLeft: 4 },
  actions: { flexDirection: 'row', gap: 6, marginTop: 8 },
  actBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,.05)',
    borderRadius: 8, padding: 8, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,.08)',
  },
  actText: { color: '#998aaa', fontSize: 10 },
  stickerToggle: {
    marginTop: 8, backgroundColor: 'rgba(255,255,255,.05)',
    borderRadius: 8, padding: 10, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,.08)',
  },
  stickerToggleText: { color: '#998aaa', fontSize: 12 },
  commentBox: { marginTop: 10, backgroundColor: '#1C0030', borderRadius: 12, padding: 10 },
  commentItem: { marginBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,.05)', paddingBottom: 8 },
  commentUser: { color: '#00FFB2', fontSize: 11, fontWeight: '700' },
  commentContent: { color: '#ccc', fontSize: 12, marginTop: 2 },
  commentInput: {
    backgroundColor: '#120020', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)',
    borderRadius: 8, padding: 10, color: '#fff', fontSize: 12, marginBottom: 6,
  },
  commentSubmit: {
    backgroundColor: '#FF2D78', borderRadius: 8,
    padding: 10, alignItems: 'center',
  },
  commentSubmitText: { color: '#fff', fontSize: 12, fontWeight: '700' },
})
