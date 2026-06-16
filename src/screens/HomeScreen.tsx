import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native'

interface Props {
  onConnect: (wallet: string, authToken: string) => void
}

export default function HomeScreen({ onConnect }: Props) {
  const [connecting, setConnecting] = useState(false)

 async function connectWallet() {
  setConnecting(true)
  try {
    const { transact } = await import('@solana-mobile/mobile-wallet-adapter-protocol-web3js')
    const result = await transact(async (wallet: any) => {
      const auth = await wallet.authorize({
        cluster: 'mainnet-beta',
        identity: {
          name: 'FootFlirt',
          uri: 'https://footflirt.app',
          icon: '/icon.png'
        }
      })
      return auth
    })
    const address = result.accounts[0].address
    const authToken = result.auth_token
    onConnect(address, authToken)
  } catch(e: any) {
    Alert.alert('Connection Error', e?.message || 'Failed to connect. Please try again.')
  } finally {
    setConnecting(false)
  }
}

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/icon.png')} style={styles.logo} />
      <Text style={styles.title}>FOOTFLIRT</Text>
      <Text style={styles.tagline}>RATE. TIP. FLIRT.</Text>
      <Text style={styles.desc}>The boldest creator app on Solana. Post your feet, get rated by AI, earn real crypto.</Text>

      <View style={styles.features}>
        {[
          {icon:'⚖️', title:'AI Judge', desc:'Scores across 5 categories'},
          {icon:'💰', title:'Earn SOL', desc:'Tips in SOL, SKR & USDC'},
          {icon:'🎯', title:'Stickers', desc:'Drop stickers on posts'},
        ].map(f => (
          <View key={f.title} style={styles.featureCard}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.connectBtn} onPress={connectWallet} disabled={connecting}>
        {connecting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.connectText}>Connect Wallet</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={()=>require('react-native').Linking.openURL('https://solflare.com')} style={{marginTop:8,marginBottom:8}}>
  <Text style={{color:'#998aaa',fontSize:12,textAlign:'center'}}>Don't have a wallet? Get Solflare</Text>
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
  },
  connectText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
})
