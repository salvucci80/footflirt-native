import React from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'

interface Props {
  onVerify: () => void
}

export default function AgeGate({ onVerify }: Props) {
  return (
    <View style={styles.container}>
      <Image source={require('../../assets/icon.png')} style={styles.logo} />
      <Text style={styles.title}>FOOTFLIRT</Text>
      <Text style={styles.subtitle}>Adults Only 18+</Text>
      <Text style={styles.desc}>
        This app contains adult content and cryptocurrency transactions. You must be 18 or older to continue.
      </Text>
      <TouchableOpacity style={styles.enterBtn} onPress={onVerify}>
        <Text style={styles.enterText}>I am 18 or older - Enter</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.exitBtn}>
        <Text style={styles.exitText}>I am under 18 - Exit</Text>
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
    padding: 32,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'System',
    fontSize: 36,
    color: '#FF2D78',
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '700',
    marginBottom: 16,
  },
  desc: {
    fontSize: 13,
    color: '#998aaa',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  enterBtn: {
    width: '100%',
    backgroundColor: '#FF2D78',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  enterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  exitBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.15)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  exitText: {
    color: '#998aaa',
    fontSize: 14,
  },
})