/**
 * Credit management system for AI operations
 *
 * This module manages credit consumption for premium AI operations.
 * Designed to be integrated with Apple Mini Apps + IAP in the future.
 *
 * FUTURE INTEGRATIONS:
 * - Apple IAP for credit purchases
 * - External billing API
 * - Usage analytics and reporting
 * - Credit expiration and renewals
 */

import { storage } from '@forge/api';
import {
  CreditOperationType,
  CreditUsageRecord,
  CreditBalance,
  CreditCheckResult
} from './types';

/**
 * Cost per operation type (in credits)
 *
 * FUTURE: These could be:
 * - Configurable per account tier
 * - Dynamic based on LLM model used
 * - Loaded from external pricing service
 */
const OPERATION_COSTS: Record<CreditOperationType, number> = {
  RISK_SUMMARY: 10,
  DEEP_REVIEW: 50
};

/**
 * Default credit allocation for new accounts
 *
 * FUTURE: This will be replaced by:
 * - IAP purchase flow
 * - Subscription tiers
 * - Free trial credits with expiration
 */
const DEFAULT_CREDITS = 10000;

/**
 * Storage keys
 */
const getBalanceKey = (accountId: string) => `credits:balance:${accountId}`;
const getUsageKey = (accountId: string) => `credits:usage:${accountId}`;

/**
 * Get credit balance for an account
 *
 * @param accountId - Jira Cloud ID or installation ID
 * @returns Current credit balance
 */
async function getBalance(accountId: string): Promise<CreditBalance> {
  const key = getBalanceKey(accountId);
  let balance = await storage.get(key) as CreditBalance | undefined;

  // Initialize new accounts with default credits
  if (!balance) {
    balance = {
      remainingCredits: DEFAULT_CREDITS,
      softLimit: 1000,  // Warning threshold
      hardLimit: 0      // Minimum allowed
    };
    await storage.set(key, balance);
  }

  return balance;
}

/**
 * Save credit balance
 */
async function saveBalance(accountId: string, balance: CreditBalance): Promise<void> {
  const key = getBalanceKey(accountId);
  await storage.set(key, balance);
}

/**
 * Record usage event
 *
 * FUTURE: Send to analytics service for:
 * - Usage tracking dashboards
 * - Billing reconciliation
 * - Fraud detection
 */
async function recordUsage(record: CreditUsageRecord): Promise<void> {
  if (!record.accountId) return;

  const key = getUsageKey(record.accountId);
  const history = (await storage.get(key) as CreditUsageRecord[] | undefined) || [];

  // Append new record
  history.push(record);

  // Keep last 1000 records (prevent unbounded growth)
  // FUTURE: Archive to external service instead of truncating
  if (history.length > 1000) {
    history.splice(0, history.length - 1000);
  }

  await storage.set(key, history);
}

/**
 * Check if account has sufficient credits for operation
 *
 * @param accountId - Jira Cloud ID
 * @param userId - User account ID (optional, for future per-user limits)
 * @param operation - Type of operation to perform
 * @returns Check result with approval and details
 */
export async function checkCredits(
  accountId: string,
  userId: string | undefined,
  operation: CreditOperationType
): Promise<CreditCheckResult> {
  try {
    const balance = await getBalance(accountId);
    const cost = OPERATION_COSTS[operation];

    if (balance.remainingCredits < cost) {
      return {
        allowed: false,
        reason: 'INSUFFICIENT_CREDITS',
        remainingCredits: balance.remainingCredits,
        operationCost: cost
      };
    }

    // Check soft limit warning
    if (balance.softLimit && balance.remainingCredits - cost < balance.softLimit) {
      // Still allowed, but could trigger UI warning
      // FUTURE: Send notification to account admin
    }

    return {
      allowed: true,
      remainingCredits: balance.remainingCredits,
      operationCost: cost
    };
  } catch (error) {
    console.error('Credit check failed:', error);
    return {
      allowed: false,
      reason: 'CREDIT_CHECK_ERROR'
    };
  }
}

/**
 * Consume credits for an operation
 *
 * This should be called AFTER the operation succeeds to deduct credits.
 *
 * @param accountId - Jira Cloud ID
 * @param userId - User account ID (optional)
 * @param operation - Type of operation performed
 * @returns Usage record
 */
export async function consumeCredits(
  accountId: string,
  userId: string | undefined,
  operation: CreditOperationType
): Promise<CreditUsageRecord> {
  const balance = await getBalance(accountId);
  const cost = OPERATION_COSTS[operation];

  // Deduct credits
  balance.remainingCredits -= cost;

  // Don't allow negative balances
  if (balance.remainingCredits < 0) {
    balance.remainingCredits = 0;
  }

  // Save updated balance
  await saveBalance(accountId, balance);

  // Create usage record
  const record: CreditUsageRecord = {
    operation,
    creditsUsed: cost,
    timestamp: new Date().toISOString(),
    userId,
    accountId
  };

  // Record usage event
  await recordUsage(record);

  return record;
}

/**
 * Get usage history for account
 *
 * FUTURE: Add filtering, pagination, date ranges
 */
export async function getUsageHistory(
  accountId: string,
  limit: number = 100
): Promise<CreditUsageRecord[]> {
  const key = getUsageKey(accountId);
  const history = (await storage.get(key) as CreditUsageRecord[] | undefined) || [];
  return history.slice(-limit);
}

/**
 * Add credits to account (admin function)
 *
 * FUTURE: This will be called by:
 * - IAP purchase webhook
 * - Billing service on subscription renewal
 * - Admin panel for manual adjustments
 *
 * @param accountId - Account to credit
 * @param amount - Credits to add
 * @param reason - Reason for credit (e.g., "IAP purchase", "refund")
 */
export async function addCredits(
  accountId: string,
  amount: number,
  reason?: string
): Promise<CreditBalance> {
  const balance = await getBalance(accountId);
  balance.remainingCredits += amount;
  await saveBalance(accountId, balance);

  // FUTURE: Record credit addition event
  console.log(`Added ${amount} credits to ${accountId}: ${reason || 'manual'}`);

  return balance;
}

/**
 * Get current balance (read-only)
 */
export async function getCurrentBalance(accountId: string): Promise<CreditBalance> {
  return getBalance(accountId);
}
