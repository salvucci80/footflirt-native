# Step-by-Step Testing Guide (Sal)

Follow these steps to test the wallet connect fixes on your Android phone.

## Before you start

You need:

- An **Android phone**
- **Phantom** or **Solflare** installed on that phone
- A small amount of **SOL** in the wallet (for tip / shop / FlirtPass tests)
- This branch checked out: `feat/wallet-connect-fixes`

---

## Step 1 — Get the code

On your computer:

```bash
git fetch origin
git checkout feat/wallet-connect-fixes
npm install
```

---

## Step 2 — Build the APK

### Option A — GitHub Actions (easiest if you use CI)

1. Go to your repo on GitHub: `salvucci80/footflirt-native`
2. Click **Actions**
3. Open **Build Android APK**
4. Click **Run workflow**
5. Select branch: **`feat/wallet-connect-fixes`**
6. Wait for the build to finish
7. Download the **footflirt-apk** artifact
8. Transfer the APK to your Android phone and install it

### Option B — Build locally

```bash
cd android
./gradlew assembleRelease
```

The APK will be at:

```
android/app/build/outputs/apk/release/app-release.apk
```

Install that file on your phone.

---

## Step 3 — Connect your wallet

1. Open the FootFlirt app on your Android phone
2. Pass the age gate if prompted
3. Tap **Connect Solana Wallet**
4. Choose **Phantom** or **Solflare** when Android asks
5. Approve the connection in your wallet app
6. Set up your username if prompted

**Expected result:** You land in the main app with your username showing in the header.

**If it fails:**

- Confirm Phantom or Solflare is installed
- Confirm you are using the **APK from this branch**, not Expo Go
- Try disconnecting and reconnecting the wallet

---

## Step 4 — Test the feed

1. Open the **Feed** tab
2. Confirm posts load
3. Tap on a post and try leaving a comment
4. Try voting on a post

**Expected result:** Feed loads and basic actions work.

---

## Step 5 — Test tipping

1. On a feed post, tap the tip action
2. Choose an amount (or enter a custom amount)
3. Approve the transaction in Phantom/Solflare

**Expected result:** Wallet opens, you sign, and you see a success message.

---

## Step 6 — Test the shop

1. Open the **Shop** tab
2. Try buying a paid sticker pack (not the free starter pack)
3. Approve the payment in your wallet

**Expected result:** Payment completes and you see a purchase confirmation.

---

## Step 7 — Test FlirtPass

1. Tap **Pass** in the bottom navigation
2. Tap **Subscribe**
3. Approve the payment in your wallet

**Expected result:** FlirtPass activates and shows as active.

---

## Step 8 — Test email login (fallback)

1. Tap **Out** to disconnect
2. Tap **Sign In with Email**
3. Log in with a test account

**Expected result:** Email login still works for users without a wallet.

---

## Step 9 — Merge or request changes

When testing is done:

- **Everything works:** Merge [Pull Request #1](https://github.com/salvucci80/footflirt-native/pull/1) into `master`
- **Something is broken:** Leave a comment on the PR with what step failed and any error message you saw

---

## Quick checklist

- [ ] APK built from `feat/wallet-connect-fixes`
- [ ] Wallet connect works
- [ ] Username setup works
- [ ] Feed loads
- [ ] Tip works
- [ ] Shop purchase works
- [ ] FlirtPass works
- [ ] Email login still works
