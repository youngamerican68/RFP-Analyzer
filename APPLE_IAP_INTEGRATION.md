# Apple IAP Integration Guide

This document explains how to integrate Apple In-App Purchases (IAP) with the AI PR Risk Summary Forge app for monetization in Apple Mini Apps.

## Current Architecture

The app already has a **credit consumption layer** designed for IAP integration:

```
User Action
    ↓
Check Credits (src/creditManager.ts)
    ↓
Sufficient? → Generate Summary → Consume Credits
    ↓
Insufficient? → Show Purchase UI
```

## Credit System Design

### Storage Structure

Credits are stored per Jira account in Forge storage:

```typescript
// Storage key: credits:balance:{accountId}
{
  remainingCredits: number,
  softLimit: number,      // Warning threshold
  hardLimit: number       // Minimum allowed (0)
}

// Storage key: credits:usage:{accountId}
[
  {
    operation: 'RISK_SUMMARY',
    creditsUsed: 10,
    timestamp: '2024-01-15T10:30:00Z',
    userId: 'user-123',
    accountId: 'account-456'
  },
  // ... more usage records
]
```

### Operation Costs

Defined in `src/creditManager.ts:24`:

```typescript
const OPERATION_COSTS: Record<CreditOperationType, number> = {
  RISK_SUMMARY: 10,   // Current feature
  DEEP_REVIEW: 50     // Future feature
};
```

## IAP Integration Steps

### Phase 1: Apple App Store Setup

1. **Enroll in Apple Developer Program**
   - Required for IAP
   - $99/year

2. **Create IAP Products in App Store Connect**

   Suggested credit bundles:
   - Starter Pack: 100 credits ($0.99)
   - Pro Pack: 500 credits ($3.99)
   - Business Pack: 2000 credits ($12.99)
   - Enterprise Pack: 10000 credits ($49.99)

3. **Configure Product IDs**
   ```
   com.yourcompany.aipr.credits.starter
   com.yourcompany.aipr.credits.pro
   com.yourcompany.aipr.credits.business
   com.yourcompany.aipr.credits.enterprise
   ```

### Phase 2: Frontend Integration

Update `static/App.tsx` to add purchase UI when credits are low:

```typescript
// Add to App.tsx
const handlePurchaseCredits = (productId: string) => {
  // Call Apple StoreKit via native bridge
  if (window.webkit?.messageHandlers?.iap) {
    window.webkit.messageHandlers.iap.postMessage({
      action: 'purchase',
      productId: productId
    });
  }
};

// Add UI when credits < softLimit
{result?.remainingCredits < 1000 && (
  <div className="low-credits-banner">
    <p>Running low on credits!</p>
    <button onClick={() => handlePurchaseCredits('com.yourcompany.aipr.credits.pro')}>
      Buy More Credits
    </button>
  </div>
)}
```

### Phase 3: Native Bridge (iOS App Side)

The host iOS app needs to handle IAP messages:

```swift
// In iOS app (host)
import StoreKit

class IAPHandler: NSObject, WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController,
                              didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any],
              let action = body["action"] as? String,
              action == "purchase",
              let productId = body["productId"] as? String else {
            return
        }

        // Initiate IAP purchase
        purchaseProduct(productId: productId)
    }

    func purchaseProduct(productId: String) {
        // Use StoreKit to purchase
        // On success, call webhook
    }
}
```

### Phase 4: Backend Webhook

Add a new resolver in `src/index.ts` to handle purchase verification:

```typescript
resolver.define('verifyAndAddCredits', async ({ payload, context }) => {
  const { receipt, productId } = payload;

  // 1. Verify receipt with Apple
  const verification = await verifyAppleReceipt(receipt);

  if (!verification.valid) {
    return { success: false, error: 'Invalid receipt' };
  }

  // 2. Determine credit amount from product ID
  const creditAmounts = {
    'com.yourcompany.aipr.credits.starter': 100,
    'com.yourcompany.aipr.credits.pro': 500,
    'com.yourcompany.aipr.credits.business': 2000,
    'com.yourcompany.aipr.credits.enterprise': 10000
  };

  const amount = creditAmounts[productId];
  if (!amount) {
    return { success: false, error: 'Unknown product' };
  }

  // 3. Add credits using existing function
  const accountId = context.cloudId || context.accountId;
  const newBalance = await addCredits(
    accountId,
    amount,
    `IAP purchase: ${productId}`
  );

  // 4. Record transaction for audit
  await recordTransaction({
    accountId,
    productId,
    creditsAdded: amount,
    receipt,
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    creditsAdded: amount,
    newBalance: newBalance.remainingCredits
  };
});
```

### Phase 5: Apple Receipt Verification

Add receipt verification helper:

```typescript
// src/appleIAP.ts (new file)
import https from 'https';

const APPLE_VERIFY_URL_PRODUCTION = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_VERIFY_URL_SANDBOX = 'https://sandbox.itunes.apple.com/verifyReceipt';

export async function verifyAppleReceipt(
  receiptData: string,
  isSandbox = false
): Promise<{ valid: boolean; receipt?: any }> {
  const url = isSandbox ? APPLE_VERIFY_URL_SANDBOX : APPLE_VERIFY_URL_PRODUCTION;
  const sharedSecret = process.env.APPLE_IAP_SHARED_SECRET;

  const requestData = {
    'receipt-data': receiptData,
    'password': sharedSecret,
    'exclude-old-transactions': true
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData)
  });

  const result = await response.json();

  // Status 0 = valid
  if (result.status === 0) {
    return { valid: true, receipt: result.receipt };
  }

  // Status 21007 = sandbox receipt sent to production, retry
  if (result.status === 21007 && !isSandbox) {
    return verifyAppleReceipt(receiptData, true);
  }

  return { valid: false };
}
```

## Security Considerations

### 1. Receipt Validation
- Always validate receipts server-side
- Never trust client-side validation
- Handle both production and sandbox environments

### 2. Duplicate Transactions
```typescript
// Store transaction IDs to prevent replay attacks
const transactionKey = `iap:transaction:${transactionId}`;
const exists = await storage.get(transactionKey);

if (exists) {
  return { success: false, error: 'Transaction already processed' };
}

await storage.set(transactionKey, { processed: true, timestamp: new Date() });
```

### 3. Audit Trail
```typescript
// Log all credit additions
await storage.set(`audit:${accountId}:${Date.now()}`, {
  type: 'CREDIT_PURCHASE',
  amount,
  productId,
  transactionId,
  receipt: receiptData.slice(0, 50) + '...', // Partial for debugging
  timestamp: new Date().toISOString()
});
```

## Testing IAP Integration

### 1. Sandbox Testing
- Create sandbox test accounts in App Store Connect
- Use test account to make purchases
- Verify credits are added correctly

### 2. Mock IAP for Development
```typescript
// Add to src/index.ts for testing
resolver.define('mockPurchase', async ({ payload, context }) => {
  if (process.env.ENVIRONMENT !== 'development') {
    return { success: false, error: 'Only available in development' };
  }

  const { productId } = payload;
  const accountId = context.cloudId;

  // Simulate purchase without Apple
  const amounts = { starter: 100, pro: 500 };
  const amount = amounts[productId] || 100;

  await addCredits(accountId, amount, 'Mock purchase');

  return { success: true, creditsAdded: amount };
});
```

## Subscription Model (Alternative)

Instead of one-time purchases, consider subscriptions:

### Monthly Plans
- **Basic**: 500 credits/month - $4.99
- **Pro**: 2000 credits/month - $14.99
- **Business**: 10000 credits/month - $49.99

### Implementation
1. Reset credits monthly using Forge scheduled functions
2. Track subscription status in storage
3. Handle subscription renewals and cancellations
4. Implement grace period for payment failures

```typescript
// src/subscriptions.ts
export async function resetMonthlyCredits() {
  // Called by Forge scheduled function
  const accounts = await getAllSubscribedAccounts();

  for (const account of accounts) {
    const plan = account.subscriptionPlan;
    const credits = PLAN_CREDITS[plan];

    await setCredits(account.id, credits, 'Monthly reset');
  }
}
```

## Pricing Strategy

### Recommended Pricing
Based on operation costs:
- 1 Risk Summary = 10 credits
- Target: $0.01 per summary (at scale)
- Therefore: 100 credits = $1.00

### Credit Bundles with Discounts
- Starter (100): $0.99 ($0.0099/credit) - no discount
- Pro (500): $3.99 ($0.0080/credit) - 20% discount
- Business (2000): $12.99 ($0.0065/credit) - 35% discount
- Enterprise (10000): $49.99 ($0.0050/credit) - 50% discount

## Revenue Sharing

With Apple:
- Apple takes 30% of first year
- 15% after first year (for subscriptions)
- Small business program: 15% if annual revenue < $1M

## Compliance

### App Store Guidelines
- Clearly display credit balance
- Show what credits can be used for
- Provide usage history
- Allow restore purchases
- Handle subscription management

### Required UI Elements
- Privacy policy link
- Terms of service
- Purchase confirmation dialog
- Receipt/history view

## Migration Path

### Current State (v1.0)
✅ Credit consumption working
✅ Balance tracking
✅ Usage recording
✅ UI shows credit info

### Next Steps (v1.1)
1. Add purchase UI in frontend
2. Implement native bridge protocol
3. Add receipt verification
4. Test with sandbox

### Production Ready (v2.0)
1. Submit for App Store review
2. Enable production IAP
3. Marketing launch
4. Monitor metrics

## Monitoring & Analytics

Track key metrics:
- Credit purchase conversion rate
- Average credits per account
- Most popular credit bundles
- Credit usage patterns
- Revenue per account

```typescript
// Example analytics event
await analytics.track('credit_purchase', {
  accountId,
  productId,
  creditsAdded,
  price,
  currency: 'USD',
  timestamp: new Date()
});
```

## Support & Refunds

Handle customer support:
- Provide credit transaction history
- Manual credit adjustments (support tool)
- Refund process (deduct credits if not used)

```typescript
resolver.define('adminAdjustCredits', async ({ payload, context }) => {
  // Verify admin permission
  if (!isAdmin(context.accountId)) {
    return { success: false, error: 'Unauthorized' };
  }

  const { accountId, amount, reason } = payload;

  await addCredits(accountId, amount, `Admin adjustment: ${reason}`);

  // Notify account
  await sendNotification(accountId, `Credits adjusted: ${amount > 0 ? '+' : ''}${amount}`);

  return { success: true };
});
```

---

## Questions?

This integration is designed to be **future-proof** and ready for Apple Mini Apps monetization. The credit system is already in place - IAP integration is the final step.

For more details:
- Apple IAP docs: https://developer.apple.com/in-app-purchase/
- StoreKit guide: https://developer.apple.com/storekit/
- Mini Apps program: https://developer.apple.com/mini-apps/
