import { NextRequest, NextResponse } from 'next/server';
import type { AnalyzeBriefRequest, ExtractedBrief, ErrorResponse } from '@/lib/types';
import { checkRateLimit, getClientIP } from '@/lib/rate-limit';
import { safeError, safeLog, truncateForLog } from '@/lib/log-sanitizer';

/**
 * POST /api/analyze-brief
 *
 * Accepts a text input (RFP, client email, project brief) and returns
 * a structured ExtractedBrief object by calling an LLM.
 *
 * Rate limited to prevent abuse (20 requests per hour per IP)
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 20 requests per hour per IP
    const clientIP = getClientIP(request.headers);
    const rateLimit = checkRateLimit(clientIP, {
      maxRequests: 20,
      windowMs: 60 * 60 * 1000, // 1 hour
    });

    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.ceil((rateLimit.retryAfter || 0) / 1000);
      safeLog(`Rate limit exceeded for IP: ${clientIP}`);

      return NextResponse.json<ErrorResponse>(
        {
          error: 'Rate limit exceeded',
          details: `Too many requests. Please try again in ${retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
            'X-RateLimit-Limit': '20',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
          },
        }
      );
    }

    // Parse request body
    const body: AnalyzeBriefRequest = await request.json();

    // Validate input
    if (!body.text || typeof body.text !== 'string' || body.text.trim().length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Text input is required and cannot be empty' },
        { status: 400 }
      );
    }

    // Log request (truncated, no PII)
    safeLog('Analyzing brief', {
      textLength: body.text.length,
      preview: truncateForLog(body.text, 100),
    });

    // Call LLM to extract structured brief
    const extractedBrief = await callLLMForBrief(body.text);

    // Add rate limit headers to successful response
    return NextResponse.json<ExtractedBrief>(extractedBrief, {
      status: 200,
      headers: {
        'X-RateLimit-Limit': '20',
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
      },
    });

  } catch (error) {
    safeError('Error in /api/analyze-brief:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json<ErrorResponse>(
      {
        error: 'Failed to analyze brief',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

/**
 * Calls the LLM API to extract a structured brief from raw text.
 *
 * TODO: Plug in your actual LLM client here (Anthropic Claude, OpenAI, etc.)
 * Environment variable required: LLM_API_KEY
 *
 * For Anthropic Claude API:
 * - Install: npm install @anthropic-ai/sdk
 * - Use model: claude-3-5-sonnet-20241022 or claude-3-opus-20240229
 *
 * For OpenAI API:
 * - Install: npm install openai
 * - Use model: gpt-4-turbo-preview or gpt-4
 */
async function callLLMForBrief(text: string): Promise<ExtractedBrief> {
  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey) {
    throw new Error('LLM_API_KEY environment variable is not set');
  }

  // System prompt: defines the AI's role and output format
  const systemPrompt = `You are an AI that extracts structured project briefs from messy text.
You will receive raw text that might be a client email, RFP, project specification, or informal notes.

Your job is to analyze this text and extract:
1. A concise project summary (1-3 sentences)
2. Project goals (list of objectives)
3. Deliverables (specific outputs expected)
4. Deadlines (any mentioned dates or timeframes)
5. Stakeholders (people or roles mentioned)
6. Clarifying questions (things that are unclear or missing)

You must respond with ONLY valid JSON matching this exact structure:
{
  "projectSummary": "string",
  "goals": ["string"],
  "deliverables": [{"title": "string", "description": "string (optional)"}],
  "deadlines": [{"label": "string", "dateString": "string"}],
  "stakeholders": [{"name": "string (optional)", "role": "string (optional)", "description": "string (optional)"}],
  "clarifyingQuestions": ["string"]
}

Do not include any explanatory text, markdown formatting, or code blocks. Return only the JSON object.`;

  // User prompt: the actual text to analyze
  const userPrompt = `Please analyze the following project brief and extract structured information:\n\n${text}`;

  // ============================================================================
  // TODO: REPLACE THIS SECTION WITH YOUR ACTUAL LLM API CALL
  // ============================================================================

  // Example for Anthropic Claude API:
  /*
  import Anthropic from '@anthropic-ai/sdk';

  const anthropic = new Anthropic({
    apiKey: apiKey,
  });

  const message = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const responseText = message.content[0].type === 'text'
    ? message.content[0].text
    : '';
  */

  // Example for OpenAI API:
  /*
  import OpenAI from 'openai';

  const openai = new OpenAI({
    apiKey: apiKey,
  });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    response_format: { type: 'json_object' }, // Ensures JSON response
  });

  const responseText = completion.choices[0].message.content || '';
  */

  // TEMPORARY: Mock response for testing without an actual LLM
  // Remove this when you plug in the real LLM client
  const responseText = JSON.stringify({
    projectSummary: "Build a web-based project management tool that integrates with ClickUp to help teams analyze and structure project briefs from various sources.",
    goals: [
      "Automatically extract structured information from unstructured project briefs",
      "Create actionable tasks in ClickUp based on extracted deliverables",
      "Reduce manual effort in project setup and scoping"
    ],
    deliverables: [
      {
        title: "Web application with text input interface",
        description: "Single-page app that accepts pasted text or uploaded documents"
      },
      {
        title: "LLM integration for brief analysis",
        description: "Backend API route that calls an LLM to extract structured data"
      },
      {
        title: "ClickUp integration",
        description: "Ability to create tasks directly in ClickUp from extracted deliverables"
      }
    ],
    deadlines: [
      {
        label: "MVP completion",
        dateString: "2024-12-31"
      }
    ],
    stakeholders: [
      {
        name: "Development team",
        role: "Implementation",
        description: "Responsible for building the application"
      },
      {
        role: "Product owner",
        description: "Defines requirements and validates outputs"
      }
    ],
    clarifyingQuestions: [
      "What file formats should be supported for upload (PDF, DOCX, TXT)?",
      "Should the app support OAuth for ClickUp or use personal API tokens?",
      "Are there any specific security requirements for handling project brief data?",
      "Should the extracted brief be stored/saved for future reference?"
    ]
  });

  // ============================================================================
  // END TODO SECTION
  // ============================================================================

  // Parse and validate the LLM response
  try {
    const parsed = JSON.parse(responseText);

    // Basic validation to ensure the structure matches ExtractedBrief
    if (!parsed.projectSummary || !Array.isArray(parsed.goals) || !Array.isArray(parsed.deliverables)) {
      throw new Error('LLM response does not match expected structure');
    }

    // Ensure all required array fields exist
    const extractedBrief: ExtractedBrief = {
      projectSummary: parsed.projectSummary || '',
      goals: Array.isArray(parsed.goals) ? parsed.goals : [],
      deliverables: Array.isArray(parsed.deliverables) ? parsed.deliverables : [],
      deadlines: Array.isArray(parsed.deadlines) ? parsed.deadlines : [],
      stakeholders: Array.isArray(parsed.stakeholders) ? parsed.stakeholders : [],
      clarifyingQuestions: Array.isArray(parsed.clarifyingQuestions) ? parsed.clarifyingQuestions : [],
    };

    return extractedBrief;

  } catch (parseError) {
    console.error('Failed to parse LLM response:', responseText);
    throw new Error('Failed to parse LLM output as valid JSON');
  }
}
