# Chapa Payment Gateway Setup Guide

## ✅ Completed Configuration

### Environment Variables Updated in Backend/.env

| Variable | Value | Status |
|----------|-------|--------|
| `CHAPA_PUBLIC_KEY` | `CHAPUBK_TEST-SalpxE5d7Qu2l7gROHKwCRQwwapwgZ7` | ✅ Configured |
| `CHAPA_WEBHOOK_SECRET` | `whsec_5f4d9e3a2b1c8d7e6f5a4b3c2d1e0f9a` | ✅ Configured |
| `CHAPA_CALLBACK_URL` | `http://localhost:5000/api/v1/payments/webhooks/chapa` | ✅ Configured |
| `CHAPA_RETURN_URL` | `http://localhost:5500/Frontend/src/pages/customer/order-tracking.html` | ✅ Configured |

### ⚠️ Required Configuration (Still Needed)

| Variable | Where to Find | Action Required |
|----------|---------------|-----------------|
| `CHAPA_SECRET_KEY` | Chapa Dashboard > Settings > API > Test Secret Key | **[PASTE ACTUAL VALUE]** |
| `CHAPA_ENCRYPTION_KEY` | Chapa Dashboard > Settings > API > Encryption Key | (Optional - currently unused) |

## 🔧 How to Get Missing Credentials

1. **CHAPA_SECRET_KEY** (Critical):
   - Go to [https://dashboard.chapa.co/dashboard/profile/profile/api](https://dashboard.chapa.co/dashboard/profile/profile/api)
   - Click the eye icon next to "Test Secret Key" to reveal it
   - Copy the key (starts with `CHASER_TEST_` or similar)
   - Replace `CHAPA_SECRET_KEY_FROM_DASHBOARD` in Backend/.env

2. **CHAPA_ENCRYPTION_KEY** (Optional):
   - Same dashboard page as above
   - Click the eye icon next to "Encryption Key" to reveal it
   - Copy if needed (currently not used by the app)

## 📁 Configuration Files

- **Backend/.env** - Main environment configuration
- **Backend/src/services/chapa.service.js** - Chapa API integration
- **Backend/src/controllers/chapa.controller.js** - Payment initialization & webhook handling

## ✨ Implementation Details

### Payment Flow
1. User initiates checkout
2. Backend calls `chapa.initialize()` with user details and amount
3. Chapa returns `checkout_url`
4. Frontend redirects to Chapa's checkout page
5. After payment, Chapa sends webhook to `/api/v1/payments/webhooks/chapa`
6. Backend validates webhook signature using `CHAPA_WEBHOOK_SECRET`
7. Payment status is updated in database

### Security
- ✅ Webhook signatures validated with HMAC-SHA256
- ✅ Secret key transmitted via Bearer token (Authorization header)
- ⚠️ **IMPORTANT**: Never commit real secret keys to version control

## 🚀 Testing Payment Flow

After adding the `CHAPA_SECRET_KEY`:

1. Start backend: `npm run dev`
2. Verify no "CHAPA_SECRET_KEY is not configured" errors in logs
3. Create a test order through the frontend
4. Attempt payment with Chapa
5. Should see checkout page instead of config error

## 🔍 Verification Checklist

- [ ] `CHAPA_SECRET_KEY` added to Backend/.env
- [ ] Backend server starts without Chapa config errors
- [ ] Payment initialization works (no 500 errors)
- [ ] Webhook validation passes
- [ ] Test payment completes successfully
