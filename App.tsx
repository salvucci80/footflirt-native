import React, { useState, useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import AgeGate from './src/screens/AgeGate'
import HomeScreen from './src/screens/HomeScreen'
import MainApp from './src/screens/MainApp'
import UsernameSetup from './src/screens/UsernameSetup'

export default function App() {
  const [wallet, setWallet] = useState<string|null>(null)
  const [username, setUsername] = useState<string|null>(null)
  const [ageVerified, setAgeVerified] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authToken, setAuthToken] = useState<string|null>(null)

  useEffect(() => {
    (async () => {
      const age = await AsyncStorage.getItem('ff_age_verified')
      const savedWallet = await AsyncStorage.getItem('ff_wallet')
      const savedUsername = await AsyncStorage.getItem('ff_username')
      const savedToken = await AsyncStorage.getItem('ff_auth_token')
      if (savedToken) setAuthToken(savedToken)
      if (age === 'true') setAgeVerified(true)
      if (savedWallet) setWallet(savedWallet)
      if (savedUsername) setUsername(savedUsername)
      setLoading(false)
    })()
  }, [])

  async function handleVerifyAge() {
    await AsyncStorage.setItem('ff_age_verified', 'true')
    setAgeVerified(true)
  }

  async function handleConnect(address: string, token: string) {
    setWallet(address)
    setAuthToken(token)
    await AsyncStorage.setItem('ff_wallet', address)
    await AsyncStorage.setItem('ff_auth_token', token)
    try {
      const res = await fetch('https://footflirt.app/api/profile?wallet=' + address)
      const data = await res.json()
      if (data.username) {
        setUsername(data.username)
        await AsyncStorage.setItem('ff_username', data.username)
      }
    } catch(e) {
      console.log('Profile fetch failed:', e)
    }
  }

  async function handleUsername(name: string) {
    setUsername(name)
    await AsyncStorage.setItem('ff_username', name)
  }

  async function handleDisconnect() {
    setWallet(null)
    setUsername(null)
    setAuthToken(null)
    await AsyncStorage.removeItem('ff_wallet')
    await AsyncStorage.removeItem('ff_username')
    await AsyncStorage.removeItem('ff_auth_token')
  }

  if (loading) return null
  if (!ageVerified) return <AgeGate onVerify={handleVerifyAge} />
  if (!wallet) return <HomeScreen onConnect={handleConnect} />
  if (!username) return <UsernameSetup wallet={wallet} onComplete={handleUsername} />

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <MainApp wallet={wallet} username={username} authToken={authToken || ''} onDisconnect={handleDisconnect} />
    </SafeAreaProvider>
  )
}
