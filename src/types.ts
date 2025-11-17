/**
 * Shared types for AI PR Risk Summary
 * Used by both backend and frontend components
 */

// Risk level classification
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

// Core risk summary returned by LLM
export interface RiskSummary {
  summary: string;              // Short paragraph describing the change
  riskLevel: RiskLevel;         // Overall risk assessment
  risks: string[];              // Bullet list of key risks/concerns
  policyFlags: string[];        // e.g., "Touches auth module"
  suggestedQuestions: string[]; // Questions for code reviewers
}

// Input to LLM for generating risk summary
export interface LlmInput {
  prTitle?: string;
  prDescription?: string;
  diffText?: string;            // Raw diff or code snippet
  filesChanged?: string[];      // File paths
  policyFlagsDetected: string[]; // From policy rules engine
}

// Credit system types
export type CreditOperationType = 'RISK_SUMMARY' | 'DEEP_REVIEW';

export interface CreditUsageRecord {
  operation: CreditOperationType;
  creditsUsed: number;
  timestamp: string;
  userId?: string;
  accountId?: string;
}

export interface CreditBalance {
  remainingCredits: number;
  softLimit?: number;  // Warning threshold
  hardLimit?: number;  // Absolute limit
}

export interface CreditCheckResult {
  allowed: boolean;
  reason?: string;
  remainingCredits?: number;
  operationCost?: number;
}

// API Request/Response types
export interface RiskSummaryRequest {
  prTitle?: string;
  prDescription?: string;
  diffText?: string;
  filesChanged?: string[];
}

export type RiskSummaryResponse =
  | {
      success: true;
      summary: RiskSummary;
      credits: {
        remainingCredits: number;
        operationCost: number;
      };
    }
  | {
      success: false;
      error: string;
      message: string;
      remainingCredits?: number;
    };

// Policy rule types
export interface PolicyRule {
  id: string;
  name: string;
  pattern: string;          // Regex or substring for matching
  description: string;
  severity: RiskLevel;
}

export interface PolicyCheckResult {
  matchedRules: PolicyRule[];
  policyFlags: string[];
  maxSeverity: RiskLevel;
}
