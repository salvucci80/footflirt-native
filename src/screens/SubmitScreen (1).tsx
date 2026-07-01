import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet, TextInput, ActivityIndicator } from 'react-native'
import { showAlert } from './CustomAlert'
import * as ImagePicker from 'expo-image-picker'

interface Props {
  wallet: string
  onPost: () => void
}

export default function SubmitScreen({ wallet, onPost }: Props) {
  const [image, setImage] = useState<string|null>(null)
  const [caption, setCaption] = useState('')
  const [phase, setPhase] = useState<'upload'|'preview'|'judging'|'result'|'posting'>('upload')
  const [score, setScore] = useState(0)
  const [breakdown, setBreakdown] = useState<any>(null)

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) { showAlert('Camera permission required'); return }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })
    if (!result.canceled) {
      setImage(result.assets[0].uri)
      setPhase('preview')
    }
  }

  async function choosePhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) { showAlert('Gallery permission required'); return }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    })
    if (!result.canceled) {
      setImage(result.assets[0].uri)
      setPhase('preview')
    }
  }

  async function judge() {
    setPhase('judging')
    await new Promise(r => setTimeout(r, 3500))
    const s = parseFloat((6.5 + Math.random() * 3).toFixed(1))
    const v = (x: number) => parseFloat(Math.min(10, Math.max(5, x + (Math.random() * 1.2 - 0.6))).toFixed(1))
    const labels = ['LEGENDARY','ELITE','FIRE','SOLID']
    const verdicts = [
      'Absolutely elite. Museum-worthy arch, flawless nails.',
      'Premium tier. Clean lines, gorgeous nail art.',
      'Strong entry. Good arch - elevate the details.',
      'Good foundation. Work on the nail details.',
    ]
    const i = s > 9 ? 0 : s > 8 ? 1 : s > 7 ? 2 : 3
    setScore(s)
    setBreakdown({
      nail_art: v(s), shape_arch: v(s), softness: v(s), vibe: v(s), shoe_pairing: v(s),
      label: labels[i], verdict: verdicts[i]
    })
    setPhase('result')
  }

 async function post() {
  setPhase('posting')
  try {
    const timestamp = Date.now()
    const filename = `post-${timestamp}.jpg`

    let body: any
    const isWeb = typeof document !== 'undefined'
    if (isWeb) {
      const resp = await fetch(image!)
      const blob = await resp.blob()
      const formData = new FormData()
      formData.append('file', blob, filename)
      body = formData
    } else {
      const formData = new FormData()
      formData.append('file', { uri: image!, name: filename, type: 'image/jpeg' } as any)
      body = formData
    }

    await fetch(`https://twqobdqejgbffrlczleh.supabase.co/storage/v1/object/posts/${filename}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3cW9iZHFlamdiZmZybGN6bGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzMDI0NDgsImV4cCI6MjA2MTg3ODQ0OH0.dBFQ8Gz2-KNRawTMPUMNcoN76WZFCoBGVGisPq4GZ2A`,
        'x-upsert': 'true',
      },
      body,
    })

    const imageUrl = `https://twqobdqejgbffrlczleh.supabase.co/storage/v1/object/public/posts/${filename}`
    
    await fetch('https://footflirt.app/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl, caption, ai_score: score, score_breakdown: breakdown, wallet_address: wallet })
    })
    onPost()
  } catch(e: any) {
    showAlert('Post failed', e?.message || 'Please try again')
    setPhase('result')
  }
}
  if (phase === 'upload') return (
    <View style={styles.container}>
      <Text style={styles.title}>Share Your Feet</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={takePhoto}>
        <Text style={styles.primaryText}>Take Photo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={choosePhoto}>
        <Text style={styles.secondaryText}>Choose from Gallery</Text>
      </TouchableOpacity>
    </View>
  )

  if (phase === 'preview') return (
    <View style={styles.container}>
      <Image source={{uri: image!}} style={styles.preview} />
      <TextInput
        style={styles.captionInput}
        placeholder="Add a caption..."
        placeholderTextColor="#998aaa"
        value={caption}
        onChangeText={setCaption}
      />
      <TouchableOpacity style={styles.primaryBtn} onPress={judge}>
        <Text style={styles.primaryText}>Submit for Judging</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={()=>setPhase('upload')}>
        <Text style={styles.secondaryText}>Retake</Text>
      </TouchableOpacity>
    </View>
  )

  if (phase === 'judging') return (
    <View style={styles.container}>
      <Text style={styles.judgeEmoji}>⚖️</Text>
      <Text style={styles.judgeName}>Judge Flirt-Bot 3000</Text>
      <ActivityIndicator size="large" color="#FF2D78" style={{marginTop: 24}} />
      <Text style={styles.judgeText}>Analyzing your submission...</Text>
    </View>
  )

  if (phase === 'result' && breakdown) return (
    <View style={styles.container}>
      <Text style={styles.bigScore}>{score}</Text>
      <Text style={styles.scoreLabel}>{breakdown.label}</Text>
      <Text style={styles.verdict}>"{breakdown.verdict}"</Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={post}>
        <Text style={styles.primaryText}>Post to Feed</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryBtn} onPress={()=>setPhase('preview')}>
        <Text style={styles.secondaryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF2D78" />
      <Text style={styles.judgeText}>Posting...</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080010', alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, color: '#FF2D78', fontWeight: '900', marginBottom: 32 },
  preview: { width: '100%', height: 300, borderRadius: 16, marginBottom: 16 },
  captionInput: {
    width: '100%', backgroundColor: '#120020', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)',
    borderRadius: 12, padding: 12, color: '#fff', fontSize: 14, marginBottom: 16,
  },
  primaryBtn: { width: '100%', backgroundColor: '#FF2D78', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { width: '100%', borderWidth: 1, borderColor: 'rgba(255,255,255,.15)', borderRadius: 14, padding: 14, alignItems: 'center' },
  secondaryText: { color: '#998aaa', fontSize: 14 },
  judgeEmoji: { fontSize: 52 },
  judgeName: { fontSize: 18, color: '#fff', fontWeight: '700', marginTop: 16 },
  judgeText: { fontSize: 13, color: '#998aaa', marginTop: 16 },
  bigScore: { fontSize: 80, color: '#FFD700', fontWeight: '900' },
  scoreLabel: { fontSize: 24, color: '#FF2D78', fontWeight: '700', marginBottom: 8 },
  verdict: { fontSize: 13, color: '#998aaa', fontStyle: 'italic', textAlign: 'center', marginBottom: 32, paddingHorizontal: 16 },
})