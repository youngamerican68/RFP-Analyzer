/**
 * LLM integration for AI PR Risk Analysis
 *
 * This module generates risk summaries using either:
 * - Mock responses (for development/testing)
 * - Real LLM API (Anthropic or OpenAI)
 *
 * TO ENABLE REAL LLM:
 * 1. Uncomment the desired provider implementation below
 * 2. Set environment variable: LLM_PROVIDER (anthropic or openai)
 * 3. Set environment variable: LLM_API_KEY
 * 4. Install SDK: npm install @anthropic-ai/sdk OR npm install openai
 * 5. Update the generateRiskSummary export at the bottom
 */

import { LlmInput, RiskSummary, RiskLevel } from './types';
import { maxRiskLevel } from './policies';

// ============================================================================
// MOCK IMPLEMENTATION (Currently Active)
// ============================================================================

/**
 * Generate a mock risk summary for development and testing
 *
 * This creates deterministic output based on input characteristics.
 */
function generateMockRiskSummary(input: LlmInput): RiskSummary {
  const {
    prTitle = 'Code changes',
    prDescription = '',
    diffText = '',
    filesChanged = [],
    policyFlagsDetected = []
  } = input;

  // Determine risk level based on policy flags and content
  let baseRiskLevel: RiskLevel = 'LOW';

  // Upgrade risk if policy flags present
  if (policyFlagsDetected.length > 0) {
    baseRiskLevel = 'MEDIUM';
  }
  if (policyFlagsDetected.some(flag =>
    flag.toLowerCase().includes('auth') ||
    flag.toLowerCase().includes('payment') ||
    flag.toLowerCase().includes('security')
  )) {
    baseRiskLevel = 'HIGH';
  }

  // Upgrade risk based on diff size
  const diffSize = diffText.length + filesChanged.length * 100;
  if (diffSize > 5000 && baseRiskLevel === 'LOW') {
    baseRiskLevel = 'MEDIUM';
  }

  // Generate risks array
  const risks: string[] = [];

  if (policyFlagsDetected.length > 0) {
    risks.push(`Affects sensitive areas: ${policyFlagsDetected.join(', ')}`);
  }

  if (filesChanged.length > 10) {
    risks.push(`Large change scope: ${filesChanged.length} files modified`);
  } else if (filesChanged.length > 0) {
    risks.push(`Modifies ${filesChanged.length} file${filesChanged.length > 1 ? 's' : ''}`);
  }

  if (diffText.toLowerCase().includes('delete') || diffText.toLowerCase().includes('remove')) {
    risks.push('Contains deletions - verify no data loss');
  }

  if (diffText.toLowerCase().includes('database') || diffText.toLowerCase().includes('migration')) {
    risks.push('Database changes require careful review and testing');
  }

  if (risks.length === 0) {
    risks.push('Standard code changes');
    risks.push('Follow normal review process');
  }

  // Ensure we have 3-5 risks
  while (risks.length < 3) {
    risks.push('Consider edge cases and error handling');
  }

  // Generate summary
  const summary = `This PR modifies ${filesChanged.length || 'some'} file(s)${
    prTitle ? ` to ${prTitle.toLowerCase()}` : ''
  }. ${
    policyFlagsDetected.length > 0
      ? `It touches sensitive areas (${policyFlagsDetected.join(', ')}) and requires careful review.`
      : 'Standard code changes that should follow normal review procedures.'
  }${
    diffSize > 3000 ? ' The change is moderately large.' : ''
  }`;

  // Generate review questions
  const suggestedQuestions: string[] = [];

  if (policyFlagsDetected.some(f => f.toLowerCase().includes('auth'))) {
    suggestedQuestions.push('How does this change affect existing authentication flows?');
    suggestedQuestions.push('Are there any security implications or vulnerabilities?');
  }

  if (policyFlagsDetected.some(f => f.toLowerCase().includes('payment'))) {
    suggestedQuestions.push('How is payment data validated and protected?');
  }

  if (filesChanged.length > 5) {
    suggestedQuestions.push('Can this change be broken into smaller PRs?');
  }

  suggestedQuestions.push('Are there sufficient unit tests for the changes?');
  suggestedQuestions.push('Have edge cases and error scenarios been considered?');
  suggestedQuestions.push('Is the code consistent with existing patterns?');

  // Keep 3-5 questions
  const finalQuestions = suggestedQuestions.slice(0, 5);

  return {
    summary,
    riskLevel: baseRiskLevel,
    risks: risks.slice(0, 5),
    policyFlags: policyFlagsDetected,
    suggestedQuestions: finalQuestions
  };
}

// ============================================================================
// ANTHROPIC IMPLEMENTATION (Commented - Ready to Enable)
// ============================================================================

/*
// TODO: Uncomment when ready to use Anthropic Claude
// Install: npm install @anthropic-ai/sdk

import Anthropic from '@anthropic-ai/sdk';

async function generateAnthropicRiskSummary(input: LlmInput): Promise<RiskSummary> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error('LLM_API_KEY environment variable not set');
  }

  const anthropic = new Anthropic({
    apiKey: apiKey
  });

  // Build context from input
  const context = buildPromptContext(input);

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: `You are an AI assistant that reviews code changes and generates risk assessments.
You must respond with ONLY a JSON object matching this structure:
{
  "summary": "Brief description of the change",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "risks": ["Risk 1", "Risk 2", "Risk 3"],
  "policyFlags": ["Flag 1", "Flag 2"],
  "suggestedQuestions": ["Question 1", "Question 2", "Question 3"]
}
Be concise. Focus on security, data, and architectural concerns.`,
    messages: [
      {
        role: 'user',
        content: `Analyze this pull request and generate a risk summary:\n\n${context}`
      }
    ]
  });

  // Parse response
  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Anthropic');
  }

  const result = JSON.parse(content.text) as RiskSummary;

  // Merge with detected policy flags
  if (input.policyFlagsDetected.length > 0) {
    result.policyFlags = Array.from(new Set([
      ...result.policyFlags,
      ...input.policyFlagsDetected
    ]));
  }

  return result;
}
*/

// ============================================================================
// OPENAI IMPLEMENTATION (Commented - Ready to Enable)
// ============================================================================

/*
// TODO: Uncomment when ready to use OpenAI GPT
// Install: npm install openai

import OpenAI from 'openai';

async function generateOpenAIRiskSummary(input: LlmInput): Promise<RiskSummary> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error('LLM_API_KEY environment variable not set');
  }

  const openai = new OpenAI({
    apiKey: apiKey
  });

  // Build context from input
  const context = buildPromptContext(input);

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are an AI assistant that reviews code changes and generates risk assessments.
You must respond with ONLY a JSON object matching this structure:
{
  "summary": "Brief description of the change",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "risks": ["Risk 1", "Risk 2", "Risk 3"],
  "policyFlags": ["Flag 1", "Flag 2"],
  "suggestedQuestions": ["Question 1", "Question 2", "Question 3"]
}
Be concise. Focus on security, data, and architectural concerns.`
      },
      {
        role: 'user',
        content: `Analyze this pull request and generate a risk summary:\n\n${context}`
      }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  const responseText = completion.choices[0]?.message?.content;
  if (!responseText) {
    throw new Error('Empty response from OpenAI');
  }

  const result = JSON.parse(responseText) as RiskSummary;

  // Merge with detected policy flags
  if (input.policyFlagsDetected.length > 0) {
    result.policyFlags = Array.from(new Set([
      ...result.policyFlags,
      ...input.policyFlagsDetected
    ]));
  }

  return result;
}
*/

// ============================================================================
// SHARED HELPER FUNCTIONS
// ============================================================================

/**
 * Build prompt context from LLM input
 */
function buildPromptContext(input: LlmInput): string {
  const parts: string[] = [];

  if (input.prTitle) {
    parts.push(`**Title:** ${input.prTitle}`);
  }

  if (input.prDescription) {
    parts.push(`**Description:** ${input.prDescription}`);
  }

  if (input.filesChanged && input.filesChanged.length > 0) {
    parts.push(`**Files Changed (${input.filesChanged.length}):**`);
    parts.push(input.filesChanged.slice(0, 20).join('\n'));
    if (input.filesChanged.length > 20) {
      parts.push(`... and ${input.filesChanged.length - 20} more files`);
    }
  }

  if (input.policyFlagsDetected && input.policyFlagsDetected.length > 0) {
    parts.push(`**Policy Flags Detected:** ${input.policyFlagsDetected.join(', ')}`);
  }

  if (input.diffText) {
    const diffPreview = input.diffText.slice(0, 3000);
    parts.push(`**Diff Preview:**\n\`\`\`\n${diffPreview}\n\`\`\``);
    if (input.diffText.length > 3000) {
      parts.push(`... (${input.diffText.length - 3000} more characters)`);
    }
  }

  return parts.join('\n\n');
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

/**
 * Generate AI risk summary for a pull request
 *
 * TO SWITCH TO REAL LLM:
 * 1. Uncomment one of the implementations above
 * 2. Change the function call below to use it
 * 3. Set LLM_API_KEY environment variable
 *
 * @param input - PR and policy context
 * @returns Risk summary with analysis
 */
export async function generateRiskSummary(input: LlmInput): Promise<RiskSummary> {
  // CURRENT: Using mock implementation
  // For production, uncomment one of these:

  // return await generateAnthropicRiskSummary(input);
  // return await generateOpenAIRiskSummary(input);

  return generateMockRiskSummary(input);
}
