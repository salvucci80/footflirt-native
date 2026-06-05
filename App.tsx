import React, { useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import HomeScreen from './src/screens/HomeScreen'
import MainApp from './src/screens/MainApp'
import AgeGate from './src/screens/AgeGate'

export default function App() {
  const [wallet, setWallet] = useState<string|null>(null)
  const [ageVerified, setAgeVerified] = useState(false)

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {!ageVerified ? (
        <AgeGate onVerify={() => setAgeVerified(true)} />
      ) : !wallet ? (
        <HomeScreen onConnect={setWallet} />
      ) : (
        <MainApp wallet={wallet} onDisconnect={() => setWallet(null)} />
      )}
    </SafeAreaProvider>
  )
}