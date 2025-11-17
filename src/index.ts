/**
 * Forge Backend Resolvers
 *
 * Main entry point for backend API functions exposed to Custom UI.
 */

import Resolver from '@forge/resolver';
import { RiskSummaryRequest, RiskSummaryResponse, LlmInput } from './types';
import { checkPolicyRules } from './policies';
import { checkCredits, consumeCredits, getCurrentBalance } from './creditManager';
import { generateRiskSummary } from './llm';

const resolver = new Resolver();

/**
 * Generate AI risk summary for a pull request
 *
 * This is the main API endpoint called by the frontend.
 * It orchestrates:
 * 1. Policy checking
 * 2. Credit verification
 * 3. LLM generation
 * 4. Credit consumption
 */
resolver.define('generateRiskSummary', async ({ payload, context }) => {
  try {
    const request = payload as RiskSummaryRequest;

    // Extract account and user IDs from Forge context
    // IMPORTANT: In Jira Cloud, cloudId is the account identifier
    const accountId = context.cloudId || context.accountId || 'default-account';
    const userId = context.accountId; // User performing the action

    console.log(`Risk summary request from account ${accountId}, user ${userId}`);

    // Step 1: Run policy detection
    const policyResult = checkPolicyRules(
      request.filesChanged,
      [request.prDescription, request.diffText].filter(Boolean).join('\n')
    );

    console.log(`Policy check: ${policyResult.matchedRules.length} rules matched, max severity: ${policyResult.maxSeverity}`);

    // Step 2: Check credits
    const creditCheck = await checkCredits(accountId, userId, 'RISK_SUMMARY');

    if (!creditCheck.allowed) {
      console.log(`Credit check failed for account ${accountId}: ${creditCheck.reason}`);

      const response: RiskSummaryResponse = {
        success: false,
        error: 'INSUFFICIENT_CREDITS',
        message: `Insufficient credits. You need ${creditCheck.operationCost || 0} credits but only have ${creditCheck.remainingCredits || 0} remaining.`,
        remainingCredits: creditCheck.remainingCredits
      };

      return response;
    }

    // Step 3: Prepare LLM input
    const llmInput: LlmInput = {
      prTitle: request.prTitle,
      prDescription: request.prDescription,
      diffText: request.diffText,
      filesChanged: request.filesChanged,
      policyFlagsDetected: policyResult.policyFlags
    };

    // Step 4: Generate risk summary using LLM
    console.log('Calling LLM to generate risk summary...');
    const summary = await generateRiskSummary(llmInput);

    // Step 5: Consume credits
    const usageRecord = await consumeCredits(accountId, userId, 'RISK_SUMMARY');

    console.log(`Risk summary generated. Consumed ${usageRecord.creditsUsed} credits. Remaining: ${creditCheck.remainingCredits! - usageRecord.creditsUsed}`);

    // Step 6: Return success response
    const response: RiskSummaryResponse = {
      success: true,
      summary,
      credits: {
        remainingCredits: (creditCheck.remainingCredits || 0) - usageRecord.creditsUsed,
        operationCost: usageRecord.creditsUsed
      }
    };

    return response;

  } catch (error) {
    console.error('Error generating risk summary:', error);

    // Return safe error to frontend
    const response: RiskSummaryResponse = {
      success: false,
      error: 'GENERATION_ERROR',
      message: 'Failed to generate risk summary. Please try again later.'
    };

    return response;
  }
});

/**
 * Get current credit balance
 *
 * Simple query endpoint for displaying credit info in the UI.
 */
resolver.define('getCredits', async ({ context }) => {
  try {
    const accountId = context.cloudId || context.accountId || 'default-account';
    const balance = await getCurrentBalance(accountId);

    return {
      success: true,
      balance
    };
  } catch (error) {
    console.error('Error fetching credits:', error);
    return {
      success: false,
      error: 'Failed to fetch credit balance'
    };
  }
});

/**
 * Health check endpoint
 */
resolver.define('ping', async () => {
  return {
    success: true,
    message: 'AI PR Risk Summary backend is running',
    timestamp: new Date().toISOString()
  };
});

/**
 * Export handler for Forge
 */
export const handler = resolver.getDefinitions();
