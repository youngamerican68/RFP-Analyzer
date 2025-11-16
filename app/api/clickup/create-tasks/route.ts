import { NextRequest, NextResponse } from 'next/server';
import type { CreateTasksRequest, CreateTasksResponse, ErrorResponse } from '@/lib/types';
import { safeError, safeLog } from '@/lib/log-sanitizer';

/**
 * POST /api/clickup/create-tasks
 *
 * Creates tasks in ClickUp based on an extracted brief.
 * Each deliverable becomes a task.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: CreateTasksRequest = await request.json();

    // Validate inputs
    if (!body.brief) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Brief data is required' },
        { status: 400 }
      );
    }

    if (!body.clickupToken || body.clickupToken.trim().length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: 'ClickUp API token is required' },
        { status: 400 }
      );
    }

    if (!body.listId || body.listId.trim().length === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: 'ClickUp List ID is required' },
        { status: 400 }
      );
    }

    // Log request (without sensitive token)
    safeLog('Creating ClickUp tasks', {
      listId: body.listId,
      deliverableCount: body.brief.deliverables.length,
    });

    // Create tasks in ClickUp
    const createdCount = await createClickUpTasks(
      body.brief,
      body.clickupToken,
      body.listId
    );

    return NextResponse.json<CreateTasksResponse>(
      {
        success: true,
        createdCount,
        message: `Successfully created ${createdCount} task(s) in ClickUp`,
      },
      { status: 200 }
    );

  } catch (error) {
    safeError('Error in /api/clickup/create-tasks:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json<ErrorResponse>(
      {
        error: 'Failed to create tasks in ClickUp',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Creates tasks in ClickUp for each deliverable in the brief.
 *
 * ClickUp API documentation: https://clickup.com/api/
 * Create Task endpoint: POST https://api.clickup.com/api/v2/list/{list_id}/task
 */
async function createClickUpTasks(
  brief: CreateTasksRequest['brief'],
  clickupToken: string,
  listId: string
): Promise<number> {
  const { deliverables, projectSummary, clarifyingQuestions, deadlines } = brief;

  if (!deliverables || deliverables.length === 0) {
    throw new Error('No deliverables found in the brief');
  }

  const clickupApiUrl = `https://api.clickup.com/api/v2/list/${listId}/task`;

  let createdCount = 0;

  // Build task description template
  const buildTaskDescription = (deliverableDescription?: string): string => {
    let description = `**From Project Brief Analyst**\n\n`;
    description += `**Project Summary:**\n${projectSummary}\n\n`;

    if (deliverableDescription) {
      description += `**Deliverable Details:**\n${deliverableDescription}\n\n`;
    }

    if (clarifyingQuestions && clarifyingQuestions.length > 0) {
      description += `**Clarifying Questions:**\n`;
      clarifyingQuestions.forEach((q) => {
        description += `- ${q}\n`;
      });
    }

    return description;
  };

  // Determine if we should use a deadline
  // For v1, we'll use the first deadline if available, or null
  // TODO: Future enhancement - match deadlines to specific deliverables
  let dueDate: number | null = null;
  if (deadlines && deadlines.length > 0) {
    try {
      const firstDeadline = new Date(deadlines[0].dateString);
      if (!isNaN(firstDeadline.getTime())) {
        // ClickUp expects timestamp in milliseconds
        dueDate = firstDeadline.getTime();
      }
    } catch (e) {
      console.warn('Failed to parse deadline:', deadlines[0].dateString);
    }
  }

  // Create a task for each deliverable
  for (const deliverable of deliverables) {
    try {
      const taskPayload = {
        name: deliverable.title,
        description: buildTaskDescription(deliverable.description),
        // Optional: Set due date (null if not available)
        due_date: dueDate,
        // Optional: Set priority (null for default)
        priority: null,
        // Optional: Set status (defaults to list's first status)
        status: null,
      };

      const response = await fetch(clickupApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': clickupToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        safeError(
          `ClickUp API error for deliverable "${deliverable.title}":`,
          { status: response.status, error: errorText }
        );
        throw new Error(
          `ClickUp API returned status ${response.status}`
        );
      }

      const result = await response.json();
      safeLog(`Created task in ClickUp:`, { taskId: result.id, title: deliverable.title });
      createdCount++;

    } catch (taskError) {
      safeError(`Failed to create task for "${deliverable.title}":`, taskError);
      // For v1, we'll fail fast on the first error
      // TODO: Future enhancement - collect errors and continue, return partial success
      throw taskError;
    }
  }

  return createdCount;
}
