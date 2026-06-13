import React, { useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import AgeGate from './src/screens/AgeGate'
import HomeScreen from './src/screens/HomeScreen'
import MainApp from './src/screens/MainApp'
import UsernameSetup from './src/screens/UsernameSetup'

export default function App() {
  const [wallet, setWallet] = useState<string|null>(null)
  const [username, setUsername] = useState<string|null>(null)
  const [ageVerified, setAgeVerified] = useState(false)

  async function handleConnect(address: string) {
    setWallet(address)
    const res = await fetch('https://footflirt.app/api/profile?wallet=' + address)
    const data = await res.json()
    if (data.username) {
      setUsername(data.username)
    }
  }

  if (!ageVerified) return <AgeGate onVerify={() => setAgeVerified(true)} />
  if (!wallet) return <HomeScreen onConnect={handleConnect} />
  if (!username) return <UsernameSetup wallet={wallet} onComplete={setUsername} />

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <MainApp wallet={wallet} username={username} onDisconnect={() => { setWallet(null); setUsername(null) }} />
    </SafeAreaProvider>
  )
}