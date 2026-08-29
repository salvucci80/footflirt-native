import React, { useEffect, useRef, useState } from 'react'
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Share, Modal, KeyboardAvoidingView, Platform, Linking } from 'react-native'
import { showAlert } from './CustomAlert'
import { FEE_WALLET, createConnection, withWalletTransaction, walletPubkeyFromAuth } from '../lib/solanaWallet'

interface Props {
  wallet: string
  authToken: string
  username: string
  onViewProfile: (username: string) => void
}

const FEET_URL = 'https://twqobdqejgbffrlczleh.supabase.co/storage/v1/object/public/posts/feet%20v.png'
const CAT_COLORS = ['#FF2D78','#C800FF','#00FFB2','#FFD700','#ff9500']
const CAT_LABELS = ['Nail Art','Shape & Arch','Softness','Vibe','Shoe Pairing']
const CATS = ['nail_art','shape_arch','softness','vibe','shoe_pairing']
const BASE_URL = 'https://footflirt.app/'
const STARTER_STICKERS = ['startera.png','starterb.png','starterc.png','starterd.png','startere.png','starterf.png']

export default function FeedScreen({ wallet, authToken, username, onViewProfile }: Props) {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [commentPost, setCommentPost] = useState<string|null>(null)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<Record<string,any[]>>({})
  const [stickerPost, setStickerPost] = useState<string|null>(null)
  const [placedStickers, setPlacedStickers] = useState<Record<string,string[]>>({})
  const [votes, setVotes] = useState<Record<string,number>>({})
  const [tipPost, setTipPost] = useState<any|null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [payModal, setPayModal] = useState<{url: string, amount: number}|null>(null)

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
    if (!commentText.trim()) return
    await fetch(`https://footflirt.app/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({username, content: commentText})
    })
    setCommentText('')
    loadComments(postId)
  }

  async function reportPost(postId: string) {
    showAlert('Report Post', 'Why are you reporting this?', [
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
      showAlert('Reported', 'Thank you for your report.', [{text: 'OK'}])
    } catch(e) {
      showAlert('Error', 'Failed to report.')
    }
  }

async function votePost(postId: string, stars: number) {
  setVotes(v => ({...v, [postId]: stars}))
  try {
    const res = await fetch(`https://footflirt.app/api/posts/${postId}/vote`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({stars, wallet_address: wallet})
    })
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || 'Vote failed: ' + res.status)
    }
    const data = await res.json()
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, community_votes: data.community_votes, community_avg: data.community_avg } : p
    ))
  } catch (e: any) {
    showAlert('Vote failed', e?.message || 'Please try again')
  }
}

  function tipUser(post: any) {
    setCustomAmount('')
    setTipPost(post)
  }

  async function sendTip(post: any, amount: number) {
    if (wallet.startsWith('email:')) {
      const recipient = post.wallet_address || FEE_WALLET
      const solanaUrl = `solana:${recipient}?amount=${amount}&label=${encodeURIComponent('FootFlirt Tip')}`
      setPayModal({ url: solanaUrl, amount })
      return
    }

    try {
      await withWalletTransaction(authToken, async ({ walletAdapter, authResult, PublicKey, Connection, Transaction, SystemProgram, LAMPORTS_PER_SOL }) => {
        const connection = createConnection(Connection)
        const fromPubkey = walletPubkeyFromAuth(authResult, PublicKey)
        const feeAmount = Math.floor(amount * LAMPORTS_PER_SOL * 0.05)
        const tipAmount = Math.floor(amount * LAMPORTS_PER_SOL * 0.95)
        const tx = new Transaction()
        if (post.wallet_address) {
          tx.add(SystemProgram.transfer({ fromPubkey, toPubkey: new PublicKey(post.wallet_address), lamports: tipAmount }))
        }
        tx.add(SystemProgram.transfer({ fromPubkey, toPubkey: new PublicKey(FEE_WALLET), lamports: feeAmount }))
        const { blockhash } = await connection.getLatestBlockhash()
        tx.recentBlockhash = blockhash
        tx.feePayer = fromPubkey
        const signedTxs = await walletAdapter.signTransactions({ transactions: [tx] })
        const sig = await connection.sendRawTransaction(signedTxs[0].serialize())
        await connection.confirmTransaction(sig)

        // Record the tip server-side so it's verified on-chain and reflected in sol_tips_received / leaderboard.
        await fetch('https://footflirt.app/api/tip?action=confirm', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            post_id: post.id,
            tx_signature: sig,
            tipper_wallet: fromPubkey.toString(),
            amount
          })
        })

        showAlert('Tip sent!', `${amount} SOL sent successfully!`)
      })
    } catch (e: any) {
      showAlert('Tip Error', String(e?.message || e))
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
  <Text style={styles.tipText}>💰 Tip</Text>
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
                    <Text style={[styles.star, myVote >= s && styles.starLit]}>★</Text>
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

    <Modal visible={!!payModal} transparent animationType="fade" onRequestClose={() => setPayModal(null)}>
  <View style={styles.walletModalOverlay}>
    <View style={styles.walletModalBox}>
      <Text style={styles.walletModalHeading}>Send Payment</Text>
      <Text style={styles.walletModalSubtext}>
        Send {payModal?.amount} SOL via your wallet app
      </Text>
      <TouchableOpacity
        style={styles.walletModalConfirmBtn}
        onPress={() => { Linking.openURL(payModal!.url); setPayModal(null) }}
      >
        <Text style={styles.walletModalConfirmLabel}>Continue to Wallet</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.walletModalDismissBtn}
        onPress={() => setPayModal(null)}
      >
        <Text style={styles.walletModalDismissLabel}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      <Modal visible={!!tipPost} transparent animationType="fade" onRequestClose={() => setTipPost(null)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.tipModal}>
            <Text style={styles.tipModalTitle}>💰 Send a Tip</Text>
            <Text style={styles.tipModalSub}>Quick amounts (SOL)</Text>
            <View style={styles.tipPresets}>
              {[0.01, 0.05, 0.1, 0.25].map(amt => (
                <TouchableOpacity key={amt} style={styles.presetBtn} onPress={() => { setTipPost(null); sendTip(tipPost, amt) }}>
                  <Text style={styles.presetText}>{amt}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.tipModalSub}>Custom amount</Text>
            <TextInput
              style={styles.tipInput}
              placeholder="0.00"
              placeholderTextColor="#555"
              keyboardType="decimal-pad"
              value={customAmount}
              onChangeText={setCustomAmount}
            />
            <View style={styles.tipActions}>
              <TouchableOpacity style={styles.tipCancelBtn} onPress={() => setTipPost(null)}>
                <Text style={styles.tipCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tipSendBtn} onPress={() => {
                const amt = parseFloat(customAmount)
                if (!customAmount || isNaN(amt) || amt <= 0) { showAlert('Invalid amount', 'Enter a valid SOL amount.'); return }
                setTipPost(null)
                sendTip(tipPost, amt)
              }}>
                <Text style={styles.tipSendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.7)', justifyContent: 'center', alignItems: 'center' },
  tipModal: {
    backgroundColor: '#1C0030', borderRadius: 20, padding: 24, width: '85%',
    borderWidth: 1, borderColor: 'rgba(255,45,120,.3)',
  },
  tipModalTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
  tipModalSub: { color: '#998aaa', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  tipPresets: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  presetBtn: {
    flex: 1, backgroundColor: 'rgba(255,45,120,.15)', borderWidth: 1,
    borderColor: 'rgba(255,45,120,.4)', borderRadius: 12, padding: 10, alignItems: 'center',
  },
  presetText: { color: '#FF2D78', fontWeight: '700', fontSize: 14 },
  tipInput: {
    backgroundColor: '#0d0018', borderWidth: 1, borderColor: 'rgba(255,255,255,.15)',
    borderRadius: 12, padding: 12, color: '#fff', fontSize: 18, textAlign: 'center', marginBottom: 16,
  },
  tipActions: { flexDirection: 'row', gap: 10 },
  tipCancelBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,.08)', borderRadius: 12, padding: 14, alignItems: 'center',
  },
  tipCancelText: { color: '#998aaa', fontWeight: '700' },
  walletModalOverlay: { flex: 1, backgroundColor: 'rgba(10,0,20,.85)', justifyContent: 'center', alignItems: 'center' },
  walletModalBox: { backgroundColor: '#2a1a3a', borderRadius: 24, padding: 28, width: '85%', borderWidth: 2, borderColor: '#00FFB2' },
  walletModalHeading: { color: '#00FFB2', fontSize: 20, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  walletModalSubtext: { color: '#e0d0f0', fontSize: 13, textAlign: 'center', marginBottom: 24 },
  walletModalConfirmBtn: { backgroundColor: '#00FFB2', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10 },
  walletModalConfirmLabel: { color: '#0a0015', fontSize: 16, fontWeight: '900' },
  walletModalDismissBtn: { backgroundColor: 'rgba(255,255,255,.1)', borderRadius: 14, padding: 14, alignItems: 'center' },
  walletModalDismissLabel: { color: '#fff', fontSize: 14, fontWeight: '700' },
  tipSendBtn: { flex: 1, backgroundColor: '#FF2D78', borderRadius: 12, padding: 14, alignItems: 'center', justifyContent: 'center' },
  tipSendText: { color: '#fff', fontWeight: '800', fontSize: 15 },
})
