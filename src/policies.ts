/**
 * Policy rules engine for detecting high-risk code changes
 *
 * This module provides simple pattern-based detection for security and
 * compliance concerns. Rules are checked against file paths and PR content.
 */

import { PolicyRule, PolicyCheckResult, RiskLevel } from './types';

/**
 * Policy rules for detecting high-risk changes
 *
 * FUTURE: These could be loaded from:
 * - Forge storage (configurable per account)
 * - External config service
 * - Jira project settings
 */
export const POLICY_RULES: PolicyRule[] = [
  {
    id: 'auth-module',
    name: 'Authentication Logic',
    pattern: '/auth/',
    description: 'Touches authentication-related code.',
    severity: 'HIGH'
  },
  {
    id: 'payment-module',
    name: 'Payment Logic',
    pattern: '/payment/',
    description: 'Touches payment or billing code.',
    severity: 'HIGH'
  },
  {
    id: 'database-migrations',
    name: 'Database Migrations',
    pattern: '/migrations?/',
    description: 'Modifies database schema or migrations.',
    severity: 'MEDIUM'
  },
  {
    id: 'security-config',
    name: 'Security Configuration',
    pattern: '/(security|config)/',
    description: 'Changes security or critical configuration.',
    severity: 'HIGH'
  },
  {
    id: 'api-endpoints',
    name: 'API Endpoints',
    pattern: '/(api|routes|endpoints)/',
    description: 'Modifies API endpoints or routing.',
    severity: 'MEDIUM'
  },
  {
    id: 'secrets-env',
    name: 'Secrets/Environment',
    pattern: '\\.(env|secrets|credentials)',
    description: 'Changes environment or secrets files.',
    severity: 'HIGH'
  },
  {
    id: 'user-data',
    name: 'User Data Access',
    pattern: '/(user|profile|account)/',
    description: 'Accesses or modifies user data.',
    severity: 'MEDIUM'
  },
  {
    id: 'admin-features',
    name: 'Admin Features',
    pattern: '/admin/',
    description: 'Changes admin or privileged functionality.',
    severity: 'HIGH'
  }
];

/**
 * Check policy rules against file paths and content
 *
 * @param filesChanged - List of file paths changed in PR
 * @param diffText - Raw diff or PR description text
 * @returns Policy check result with matched rules and flags
 */
export function checkPolicyRules(
  filesChanged?: string[],
  diffText?: string
): PolicyCheckResult {
  const matchedRules: PolicyRule[] = [];
  const policyFlags: string[] = [];

  // Combine all text to search
  const searchText = [
    ...(filesChanged || []),
    diffText || ''
  ].join('\n');

  // Check each rule
  for (const rule of POLICY_RULES) {
    try {
      // Create regex from pattern (support both regex and simple strings)
      const regex = new RegExp(rule.pattern, 'i');

      if (regex.test(searchText)) {
        matchedRules.push(rule);
        policyFlags.push(rule.name);
      }
    } catch (error) {
      // If pattern is invalid regex, try simple includes
      if (searchText.toLowerCase().includes(rule.pattern.toLowerCase())) {
        matchedRules.push(rule);
        policyFlags.push(rule.name);
      }
    }
  }

  // Determine max severity from matched rules
  let maxSeverity: RiskLevel = 'LOW';
  for (const rule of matchedRules) {
    if (rule.severity === 'HIGH') {
      maxSeverity = 'HIGH';
      break;
    } else if (rule.severity === 'MEDIUM' && maxSeverity !== 'HIGH') {
      maxSeverity = 'MEDIUM';
    }
  }

  return {
    matchedRules,
    policyFlags,
    maxSeverity
  };
}

/**
 * Get severity level as a number for comparison
 */
export function getSeverityValue(level: RiskLevel): number {
  switch (level) {
    case 'HIGH': return 3;
    case 'MEDIUM': return 2;
    case 'LOW': return 1;
    default: return 0;
  }
}

/**
 * Get the higher of two risk levels
 */
export function maxRiskLevel(a: RiskLevel, b: RiskLevel): RiskLevel {
  return getSeverityValue(a) >= getSeverityValue(b) ? a : b;
}
