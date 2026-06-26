import React from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'

interface AlertButton {
  text: string
  onPress?: () => void
  style?: 'default' | 'cancel' | 'destructive'
}

interface AlertState {
  visible: boolean
  title: string
  message?: string
  buttons: AlertButton[]
}

const initial: AlertState = { visible: false, title: '', buttons: [] }

let _setAlert: (s: AlertState) => void = () => {}

export function useCustomAlert() {
  const [alert, setAlert] = React.useState<AlertState>(initial)
  _setAlert = setAlert

  const dismiss = () => setAlert(initial)

  const component = (
    <Modal transparent visible={alert.visible} animationType="fade" onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>{alert.title}</Text>
          {alert.message ? <Text style={styles.message}>{alert.message}</Text> : null}
          <View style={styles.btnRow}>
            {alert.buttons.map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.btn,
                  btn.style === 'cancel' && styles.cancelBtn,
                  btn.style === 'destructive' && styles.destructiveBtn,
                  !btn.style || btn.style === 'default' ? styles.defaultBtn : null,
                ]}
                onPress={() => { dismiss(); btn.onPress?.() }}
              >
                <Text style={[
                  styles.btnText,
                  btn.style === 'cancel' && styles.cancelText,
                  btn.style === 'destructive' && styles.destructiveText,
                ]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )

  return component
}

export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  _setAlert({
    visible: true,
    title,
    message,
    buttons: buttons || [{ text: 'OK' }],
  })
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  box: {
    width: '100%',
    backgroundColor: '#1C0030',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,45,120,.3)',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#998aaa',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  btnRow: {
    gap: 8,
  },
  btn: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  defaultBtn: {
    backgroundColor: '#FF2D78',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,.15)',
  },
  destructiveBtn: {
    backgroundColor: 'rgba(255,60,60,.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,60,60,.4)',
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  cancelText: {
    color: '#998aaa',
  },
  destructiveText: {
    color: '#ff3c3c',
  },
})