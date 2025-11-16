/**
 * Core data model for an extracted project brief
 * This type is shared across frontend and backend
 */
export type ExtractedBrief = {
  projectSummary: string;
  goals: string[];
  deliverables: {
    title: string;
    description?: string;
  }[];
  deadlines: {
    label: string;
    dateString: string;
  }[];
  stakeholders: {
    name?: string;
    role?: string;
    description?: string;
  }[];
  clarifyingQuestions: string[];
};

/**
 * Request/Response types for API routes
 */
export type AnalyzeBriefRequest = {
  text: string;
};

export type AnalyzeBriefResponse = ExtractedBrief;

export type CreateTasksRequest = {
  brief: ExtractedBrief;
  clickupToken: string;
  listId: string;
};

export type CreateTasksResponse = {
  success: boolean;
  createdCount: number;
  message?: string;
};

export type ErrorResponse = {
  error: string;
  details?: string;
};
