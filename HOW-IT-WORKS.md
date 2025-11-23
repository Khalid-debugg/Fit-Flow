# How the License System Works

## Visual Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    GYM OWNER'S COMPUTER                         │
│                                                                 │
│  1. Launch FitFlow                                              │
│     └──> App generates Hardware ID from:                        │
│          • Motherboard UUID                                     │
│          • MAC Address                                          │
│          Result: A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6             │
│                                                                 │
│  2. Activation Dialog appears                                   │
│     ┌────────────────────────────────────┐                     │
│     │  Activate FitFlow                  │                     │
│     │                                    │                     │
│     │  Your Hardware ID:                 │                     │
│     │  A1B2-C3D4-E5F6-... [Copy]         │                     │
│     │                                    │                     │
│     │  License Key:                      │                     │
│     │  [________________]                │                     │
│     │                                    │                     │
│     │              [Activate]            │                     │
│     └────────────────────────────────────┘                     │
│                                                                 │
│  3. Gym owner copies Hardware ID                               │
│     └──> Sends it to YOU                                       │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ Hardware ID sent via
                          │ email, WhatsApp, etc.
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR COMPUTER (ADMIN)                        │
│                                                                 │
│  4. You receive Hardware ID                                     │
│     └──> Run: node generate-license.js A1B2C3D4...             │
│                                                                 │
│  5. Script generates License Key:                               │
│     Algorithm: HMAC-SHA256(SECRET_KEY, HARDWARE_ID)            │
│     Result: 250C-3D5B-3352-52AA-0B48-8D4E                      │
│                                                                 │
│  6. Send License Key back to gym owner                          │
│     └──> Via email, WhatsApp, etc.                             │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │ License Key sent back
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    GYM OWNER'S COMPUTER                         │
│                                                                 │
│  7. Gym owner enters License Key                                │
│     └──> Clicks "Activate"                                     │
│                                                                 │
│  8. App validates:                                              │
│     • Regenerates HMAC-SHA256(SECRET_KEY, CURRENT_HARDWARE_ID) │
│     • Compares with entered License Key                        │
│     • If match ✅ = Activated!                                 │
│     • If no match ❌ = Invalid key error                       │
│                                                                 │
│  9. License saved to disk (encrypted)                           │
│     Location: %APPDATA%\fitflow\license.dat                    │
│                                                                 │
│  10. App opens and works normally                               │
│      On every future launch:                                    │
│      • Checks if license.dat exists                            │
│      • Validates it matches current hardware                   │
│      • If valid → App opens                                    │
│      • If invalid → Activation dialog appears                  │
└─────────────────────────────────────────────────────────────────┘
```

## What Happens if They Copy the App?

```
┌─────────────────────────────────────────────────────────────────┐
│              GYM OWNER TRIES TO COPY APP                        │
│                                                                 │
│  Computer A (Original - Licensed)                               │
│  Hardware ID: A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6                 │
│  License Key: 250C-3D5B-3352-52AA-0B48-8D4E                    │
│  Status: ✅ WORKS                                               │
│                                                                 │
│           │ Gym owner copies entire app folder                  │
│           │ to a USB drive and transfers                        │
│           ▼                                                      │
│                                                                 │
│  Computer B (Different PC)                                      │
│  Hardware ID: F9E8D7C6B5A4F3E2D1C0B9A8F7E6D5C4  ← Different!  │
│  Stored License: 250C-3D5B-3352-52AA-0B48-8D4E                 │
│                                                                 │
│  On Launch:                                                     │
│  1. App reads stored license.dat                                │
│  2. Generates current Hardware ID → F9E8D7C6B5A4F3E2D1C0B9A8...│
│  3. Calculates HMAC(SECRET, F9E8D7C6...) → XYZ-ABC-DEF-...     │
│  4. Compares: XYZ-ABC-DEF ≠ 250C-3D5B-3352                     │
│  5. Result: ❌ INVALID LICENSE                                  │
│  6. Shows activation dialog again                               │
│                                                                 │
│  Status: ❌ DOESN'T WORK - Requires new activation              │
└─────────────────────────────────────────────────────────────────┘
```

## Security Components

### 1. Hardware ID Generation
- **Unique per machine**: Uses motherboard UUID + MAC address
- **Platform-specific**:
  - Windows: `wmic csproduct get UUID` + `getmac`
  - macOS: `system_profiler SPHardwareDataType`
  - Linux: `/etc/machine-id`

### 2. License Key Generation
- **Algorithm**: HMAC-SHA256
- **Input**: SECRET_KEY + Hardware ID
- **Output**: 24-character hex string (formatted as 6 groups)
- **One-way**: Can't reverse-engineer Hardware ID from License Key

### 3. Storage
- **Location**: Electron userData directory
- **Encryption**: AES-256-CBC with random IV
- **Why encrypt?**: Makes it harder to copy license files

### 4. Validation
- **Every launch**: Checks if stored license matches current hardware
- **Offline**: No internet connection needed after activation
- **Automatic**: User doesn't need to re-enter key

## Limitations & Considerations

### ✅ What This Protects Against
1. Casual copying to different computers
2. Sharing app with other gyms
3. Running on virtual machines (different hardware)

### ⚠️ What This Doesn't Protect Against
1. Determined reverse engineers
2. Code decompilation and modification
3. VM cloning (if VM hardware is cloned too)

### 🎯 Perfect For
- **MVP/Demo** distribution
- **Preventing casual sharing**
- **Small-scale distribution** (gyms, small businesses)
- **Offline environments** (no server needed)

### 📈 Consider Upgrading To (For Commercial)
- Online activation servers
- Code obfuscation
- Anti-debugging measures
- Hardware dongles
- Subscription-based licensing

## Summary

This is a **simple, effective, offline licensing system** perfect for your MVP use case:
- Quick to implement ✅
- Works offline ✅
- Prevents casual copying ✅
- Easy to manage ✅
- No server costs ✅
