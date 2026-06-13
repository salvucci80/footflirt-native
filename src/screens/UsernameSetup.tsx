import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'

interface Props {
  wallet: string
  onComplete: (username: string) => void
}

export default function UsernameSetup({ wallet, onComplete }: Props) {
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!username.trim()) return
    setSaving(true)
    const handle = username.startsWith('@') ? username : '@' + username
    try {
      await fetch('https://footflirt.app/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet_address: wallet, username: handle })
      })
      onComplete(handle)
    } catch(e) {
      Alert.alert('Error', 'Failed to save username')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Username</Text>
      <Text style={styles.subtitle}>This is how you appear on FootFlirt</Text>
      <TextInput
        style={styles.input}
        placeholder="@your_username"
        placeholderTextColor="#998aaa"
        value={username}
        onChangeText={t => setUsername(t.replace(/\s/g, ''))}
        maxLength={30}
        autoFocus
      />
      <TouchableOpacity style={styles.btn} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Username</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onComplete('@anonymous')}>
        <Text style={styles.skip}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080010', alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 28, color: '#FF2D78', fontWeight: '900', marginBottom: 8 },
  subtitle: { fontSize: 13, color: '#998aaa', textAlign: 'center', marginBottom: 32 },
  input: {
    width: '100%', backgroundColor: '#120020',
    borderWidth: 1, borderColor: 'rgba(255,255,255,.15)',
    borderRadius: 12, padding: 14, color: '#fff',
    fontSize: 16, marginBottom: 16,
  },
  btn: { width: '100%', backgroundColor: '#FF2D78', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skip: { color: '#998aaa', fontSize: 13 },
})