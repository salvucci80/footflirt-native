# What We Changed (Wallet Connect Fixes)

Branch: `feat/wallet-connect-fixes`  
Draft PR: https://github.com/salvucci80/footflirt-native/pull/1

This document explains what was changed, why, and which files were touched.

---

## Goal

Fix Android wallet connect and payments so users can:

1. Connect Phantom or Solflare on Android
2. Stay connected across tips, shop purchases, and FlirtPass
3. Complete payments without address/API errors

---

## Summary of fixes

| Area | Problem | Fix |
|---|---|---|
| Wallet connect | Logic duplicated across screens with small inconsistencies | Centralized in `src/lib/solanaWallet.ts` |
| Android discovery | App could not reliably find installed wallet apps | Added Phantom/Solflare to `AndroidManifest.xml` queries |
| Deep links | Malformed intent filter names broke return from wallet | Fixed intent filter action/category names |
| Payments | Each payment re-authorized from scratch | Reuse stored auth token when possible |
| Shop API | Sent raw encoded address instead of base58 wallet string | Now sends the connected wallet address |
| Home screen | Debug error popup shown to users on connect failure | Removed debug alert; cleaner error message |

---

## New file

### `src/lib/solanaWallet.ts`

Shared wallet module for the Android app. Handles:

- **`connectSolanaWallet()`** — initial wallet connection on the home screen
- **`withWalletTransaction()`** — tips, shop, FlirtPass payments
- **`authorizeSession()`** — reuses auth token or prompts fresh authorize
- **`walletPubkeyFromAuth()`** — safely decodes wallet addresses from MWA

Constants moved here:

- App identity (name, URI, icon)
- RPC URL
- Fee wallet address

---

## Modified files

### `src/screens/HomeScreen.tsx`

- Uses `connectSolanaWallet()` instead of inline MWA code
- Removed debug popup on address decode failure
- Clearer error message if wallet connect fails

### `src/screens/FeedScreen.tsx`

- Tips use `withWalletTransaction(authToken, ...)`
- Reuses session token instead of authorizing every tip

### `src/screens/ShopScreen.tsx`

- Purchases use shared wallet transaction helper
- **Bug fix:** purchase API now sends `wallet` (base58 string) instead of raw `authResult.accounts[0].address`

### `src/screens/FlirtPassScreen.tsx`

- Subscription payment uses shared wallet transaction helper
- Reuses auth token for payment flow

### `android/app/src/main/AndroidManifest.xml`

**Added wallet discovery (Android 11+):**

```xml
<intent>
  <action android:name="android.intent.action.VIEW"/>
  <category android:name="android.intent.category.BROWSABLE"/>
  <data android:scheme="solana-wallet"/>
</intent>
<package android:name="app.phantom"/>
<package android:name="com.solflare.mobile"/>
```

**Fixed broken deep link intent filter:**

- Before: `android.intent.action.android.intent.action.VIEW` (invalid)
- After: `android.intent.action.VIEW` (correct)

### `app.json`

- Added `"scheme": "footflirt"` for app deep linking when returning from wallet apps

---

## What we did NOT change

- Email login (Supabase) — unchanged
- Feed API calls — unchanged
- Image upload flow — unchanged
- `master` branch — untouched until PR is merged
- Web/browser wallet support — not added (Android app only, as you had it)

---

## How wallet connect works now

```text
Home screen
  └─ connectSolanaWallet()
       └─ Mobile Wallet Adapter (Android)
            └─ Phantom or Solflare app

Tips / Shop / FlirtPass
  └─ withWalletTransaction(authToken)
       └─ reauthorize (if token exists) OR authorize (fresh)
            └─ sign transaction in wallet app
                 └─ send to Solana network
```

---

## Testing notes

- **Requires Android APK** — wallet connect uses native Mobile Wallet Adapter
- **Does not work in Expo Go** — needs the native build
- **Requires wallet app** — Phantom or Solflare on the phone
- **Email login** still works as fallback on any device

See [TESTING.md](./TESTING.md) for full step-by-step instructions.

---

## After merge

Once you merge PR #1 into `master`:

1. Your normal GitHub Actions APK build will include these fixes
2. Future builds from `master` will have the updated wallet flow
3. You can delete branch `feat/wallet-connect-fixes` after merge (optional)
