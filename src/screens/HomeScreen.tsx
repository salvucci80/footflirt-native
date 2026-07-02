
import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useCustomAlert, showAlert } from './CustomAlert'
import { supabase } from './supabase'
import { addressToPublicKey } from '../lib/walletAddress'

interface Props {
  onConnect: (wallet: string, authToken: string) => void
}

export default function HomeScreen({ onConnect }: Props) {
  const alertModal = useCustomAlert()
  const [mode, setMode] = useState<'main'|'email-login'|'email-signup'>('main')
  const [connecting, setConnecting] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function connectWallet() {
    setConnecting(true)
    try {
      const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol-web3js')
      const { PublicKey } = await import('@solana/web3.js')
      const result = await transact(async (wallet: any) => {
        const auth = await wallet.authorize({
          cluster: 'mainnet-beta',
          identity: {
            name: 'FootFlirt',
            uri: 'https://footflirt.app',
            icon: 'icon.png'
          }
        })
        return auth
      })
      const account = result.accounts[0]
      const address = addressToPublicKey(account.address, PublicKey).toBase58()
      const authToken = result.auth_token || result.authToken || ''
      onConnect(address, authToken)
    } catch (e: any) {
      showAlert('Connection Error', e?.message || 'Failed to connect wallet. Make sure you have a Solana wallet app installed (Phantom, Solflare, etc).')
    } finally {
      setConnecting(false)
    }
  }

  async function handleEmailLogin() {
    if (!email.trim() || !password.trim()) {
      showAlert('Missing fields', 'Please enter your email and password.')
      return
    }
    setConnecting(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) {
        showAlert('Login Failed', error.message)
        return
      }
      const userId = data.user?.id || data.session?.user?.id
      if (userId) {
        onConnect('email:' + userId, data.session?.access_token || '')
      }
    } catch (e: any) {
      showAlert('Error', e?.message || 'Login failed')
    } finally {
      setConnecting(false)
    }
  }

  async function handleEmailSignup() {
    if (!email.trim() || !password.trim()) {
      showAlert('Missing fields', 'Please enter your email and password.')
      return
    }
    if (password.length < 6) {
      showAlert('Weak password', 'Password must be at least 6 characters.')
      return
    }
    setConnecting(true)
    try {
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
      if (error) {
        showAlert('Signup Failed', error.message)
        return
      }
      if (data.session) {
        const userId = data.user?.id
        onConnect('email:' + userId, data.session.access_token || '')
      } else {
        showAlert('Check your email', 'We sent a confirmation link to ' + email.trim() + '. Please confirm and then log in.')
        setMode('email-login')
      }
    } catch (e: any) {
      showAlert('Error', e?.message || 'Signup failed')
    } finally {
      setConnecting(false)
    }
  }

  if (mode === 'email-login' || mode === 'email-signup') {
    const isSignup = mode === 'email-signup'
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {alertModal}
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
          <Text style={styles.title}>FOOTFLIRT</Text>
          <Text style={styles.tagline}>{isSignup ? 'CREATE ACCOUNT' : 'SIGN IN'}</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#998aaa"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#998aaa"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={styles.connectBtn}
            onPress={isSignup ? handleEmailSignup : handleEmailLogin}
            disabled={connecting}
          >
            {connecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.connectText}>{isSignup ? 'Create Account' : 'Sign In'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode(isSignup ? 'email-login' : 'email-signup')}>
            <Text style={styles.switchText}>
              {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setMode('main')} style={{ marginTop: 16 }}>
            <Text style={styles.switchText}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  return (
    <View style={styles.container}>
      {alertModal}
      <Image source={require('../../assets/icon.png')} style={styles.logo} />
      <Text style={styles.title}>FOOTFLIRT</Text>
      <Text style={styles.tagline}>RATE. TIP. FLIRT.</Text>
      <Text style={styles.desc}>The boldest creator app on Solana. Post your feet, get rated by AI, earn real crypto.</Text>

      <View style={styles.features}>
        {[
          { icon: '⚖️', title: 'AI Judge', desc: 'Scores across 5 categories' },
          { icon: '💰', title: 'Earn SOL', desc: 'Tips in SOL, SKR & USDC' },
          { icon: '🎯', title: 'Stickers', desc: 'Drop stickers on posts' },
        ].map(f => (
          <View key={f.title} style={styles.featureCard}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.connectBtn} onPress={() => setMode('email-login')}>
        <Text style={styles.connectText}>Sign In with Email</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.walletBtn} onPress={connectWallet} disabled={connecting}>
        {connecting ? (
          <ActivityIndicator color="#FF2D78" />
        ) : (
          <Text style={styles.walletText}>Connect Solana Wallet</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => require('react-native').Linking.openURL('https://solflare.com')} style={{ marginTop: 8 }}>
        <Text style={{ color: '#998aaa', fontSize: 12, textAlign: 'center' }}>Don't have a wallet? Get Solflare</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080010',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 48,
    color: '#FF2D78',
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  desc: {
    fontSize: 13,
    color: '#998aaa',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  features: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
    width: '100%',
  },
  featureCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,.05)',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.08)',
  },
  featureIcon: { fontSize: 24, marginBottom: 6 },
  featureTitle: { fontSize: 11, fontWeight: '700', color: '#fff', marginBottom: 4 },
  featureDesc: { fontSize: 10, color: '#998aaa', textAlign: 'center' },
  connectBtn: {
    width: '100%',
    backgroundColor: '#FF2D78',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  connectText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  walletBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,45,120,.4)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  walletText: {
    color: '#FF2D78',
    fontSize: 16,
    fontWeight: '700',
  },
  input: {
    width: '100%',
    backgroundColor: '#120020',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.15)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  switchText: {
    color: '#998aaa',
    fontSize: 13,
    marginTop: 8,
  },
})
