'use client';

import { useState } from 'react';
import type { ExtractedBrief } from '@/lib/types';

// Sample RFP text for testing
const SAMPLE_RFP = `Request for Proposal: E-Commerce Mobile App Development

Project Overview:
We are seeking a development partner to build a mobile e-commerce application for our retail business, "TechGear Plus". The app should provide a seamless shopping experience for electronics and tech accessories.

Project Goals:
- Increase mobile sales by 40% in the first year
- Improve customer engagement and retention
- Reduce cart abandonment rate
- Provide personalized product recommendations

Key Deliverables:
1. Native mobile applications for iOS and Android
2. User authentication and profile management system
3. Product catalog with search and filtering capabilities
4. Shopping cart and secure checkout flow
5. Payment gateway integration (Stripe, PayPal)
6. Order tracking and history
7. Push notifications for promotions and order updates
8. Admin dashboard for product and order management
9. API documentation and deployment guide

Timeline and Deadlines:
- Proposal submission: January 15, 2024
- Project kickoff: February 1, 2024
- Design mockups: March 1, 2024
- Beta version: April 15, 2024
- Final delivery and launch: June 1, 2024

Stakeholders:
- Sarah Chen, VP of Digital Commerce (Project Sponsor)
- Mike Rodriguez, Head of IT (Technical Lead)
- Jennifer Park, Marketing Director (Business Owner)
- David Liu, Customer Experience Manager (UX Lead)

Budget: $150,000 - $200,000

Technical Requirements:
- Must support iOS 14+ and Android 10+
- Integration with existing inventory management system (SAP)
- Compliance with PCI DSS for payment processing
- Support for multiple languages (English, Spanish, French)
- Analytics integration (Google Analytics, Mixpanel)

Open Questions:
1. Should we include augmented reality (AR) product preview features?
2. What's the expected daily active user count for infrastructure planning?
3. Do you require offline mode functionality?
4. Should the app support multiple currencies for international customers?
5. What are your preferences for cloud hosting (AWS, Google Cloud, Azure)?
6. Do you need integration with social media for social login and sharing?

Additional Notes:
Our current website receives approximately 50,000 monthly visitors, with 30% accessing via mobile devices. We expect the app to significantly increase mobile engagement.

Please submit proposals including timeline, cost breakdown, team composition, and portfolio of similar projects.`;

export default function Home() {
  // Input state
  const [inputText, setInputText] = useState('');

  // Analysis state
  const [analyzedBrief, setAnalyzedBrief] = useState<ExtractedBrief | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // ClickUp integration state
  const [clickupToken, setClickupToken] = useState('');
  const [listId, setListId] = useState('');
  const [isCreatingTasks, setIsCreatingTasks] = useState(false);
  const [clickupError, setClickupError] = useState<string | null>(null);
  const [clickupSuccess, setClickupSuccess] = useState<string | null>(null);

  // Copy to clipboard state
  const [copySuccess, setCopySuccess] = useState(false);

  /**
   * Analyze the input text by calling the /api/analyze-brief endpoint
   */
  const handleAnalyzeBrief = async () => {
    if (!inputText.trim()) {
      setAnalyzeError('Please enter some text to analyze');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeError(null);
    setAnalyzedBrief(null);

    try {
      const response = await fetch('/api/analyze-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze brief');
      }

      const brief: ExtractedBrief = await response.json();
      setAnalyzedBrief(brief);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setAnalyzeError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * Copy the analyzed brief as Markdown to clipboard
   */
  const handleCopyAsMarkdown = async () => {
    if (!analyzedBrief) return;

    const markdown = generateMarkdown(analyzedBrief);

    try {
      await navigator.clipboard.writeText(markdown);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  /**
   * Load sample RFP text for testing
   */
  const handleLoadSample = () => {
    setInputText(SAMPLE_RFP);
    setAnalyzedBrief(null);
    setAnalyzeError(null);
  };

  /**
   * Create tasks in ClickUp by calling the /api/clickup/create-tasks endpoint
   */
  const handleCreateClickUpTasks = async () => {
    if (!analyzedBrief) return;

    if (!clickupToken.trim() || !listId.trim()) {
      setClickupError('Please provide both ClickUp API token and List ID');
      return;
    }

    setIsCreatingTasks(true);
    setClickupError(null);
    setClickupSuccess(null);

    try {
      const response = await fetch('/api/clickup/create-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brief: analyzedBrief,
          clickupToken,
          listId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create tasks');
      }

      const result = await response.json();
      setClickupSuccess(result.message || 'Tasks created successfully!');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setClickupError(errorMessage);
    } finally {
      setIsCreatingTasks(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Project Brief Analyst
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Analyze RFPs, client emails, and project briefs. Extract structured information and create ClickUp tasks.
        </p>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel: Input */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Input
            </h2>

            <textarea
              className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Paste client email, RFP, or project brief here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isAnalyzing}
            />

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleLoadSample}
                disabled={isAnalyzing}
                className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                title="Load a sample RFP to test the analyzer"
              >
                Load Sample RFP
              </button>
              <button
                onClick={handleAnalyzeBrief}
                disabled={isAnalyzing || !inputText.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Brief'}
              </button>
            </div>

            {analyzeError && (
              <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded-lg">
                <strong>Error:</strong> {analyzeError}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Output */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Analysis Results
            </h2>

            {!analyzedBrief ? (
              <div className="text-gray-500 dark:text-gray-400 text-center py-12">
                No analysis yet. Paste text and click Analyze.
              </div>
            ) : (
              <div className="space-y-6">
                {/* Project Summary */}
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Project Summary
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    {analyzedBrief.projectSummary}
                  </p>
                </section>

                {/* Goals */}
                {analyzedBrief.goals.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Goals
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      {analyzedBrief.goals.map((goal, idx) => (
                        <li key={idx}>{goal}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Deliverables */}
                {analyzedBrief.deliverables.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Deliverables
                    </h3>
                    <div className="space-y-2">
                      {analyzedBrief.deliverables.map((deliverable, idx) => (
                        <div key={idx} className="border-l-4 border-blue-500 pl-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {deliverable.title}
                          </div>
                          {deliverable.description && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {deliverable.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Deadlines */}
                {analyzedBrief.deadlines.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Deadlines
                    </h3>
                    <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                      {analyzedBrief.deadlines.map((deadline, idx) => (
                        <li key={idx}>
                          <span className="font-medium">{deadline.label}:</span>{' '}
                          {deadline.dateString}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Stakeholders */}
                {analyzedBrief.stakeholders.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Stakeholders
                    </h3>
                    <div className="space-y-2">
                      {analyzedBrief.stakeholders.map((stakeholder, idx) => (
                        <div key={idx} className="text-gray-700 dark:text-gray-300">
                          {stakeholder.name && (
                            <span className="font-medium">{stakeholder.name}</span>
                          )}
                          {stakeholder.role && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {stakeholder.name ? ` - ${stakeholder.role}` : stakeholder.role}
                            </span>
                          )}
                          {stakeholder.description && (
                            <div className="text-sm mt-1">{stakeholder.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Clarifying Questions */}
                {analyzedBrief.clarifyingQuestions.length > 0 && (
                  <section>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Clarifying Questions
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      {analyzedBrief.clarifyingQuestions.map((question, idx) => (
                        <li key={idx}>{question}</li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Actions */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
                  {/* Copy as Markdown */}
                  <button
                    onClick={handleCopyAsMarkdown}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    {copySuccess ? '✓ Copied!' : 'Copy tasks as Markdown'}
                  </button>

                  {/* ClickUp Integration */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      Create Tasks in ClickUp
                    </h4>

                    <input
                      type="text"
                      placeholder="ClickUp API Token"
                      value={clickupToken}
                      onChange={(e) => setClickupToken(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      disabled={isCreatingTasks}
                    />

                    <input
                      type="text"
                      placeholder="List ID"
                      value={listId}
                      onChange={(e) => setListId(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      disabled={isCreatingTasks}
                    />

                    <button
                      onClick={handleCreateClickUpTasks}
                      disabled={isCreatingTasks || !clickupToken.trim() || !listId.trim()}
                      className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    >
                      {isCreatingTasks ? 'Creating Tasks...' : 'Create Tasks in ClickUp'}
                    </button>

                    {clickupSuccess && (
                      <div className="p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 rounded text-sm">
                        {clickupSuccess}
                      </div>
                    )}

                    {clickupError && (
                      <div className="p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 rounded text-sm">
                        <strong>Error:</strong> {clickupError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Generate Markdown representation of the analyzed brief
 */
function generateMarkdown(brief: ExtractedBrief): string {
  let markdown = '';

  // Project summary as title
  const title = brief.projectSummary.substring(0, 60) + (brief.projectSummary.length > 60 ? '...' : '');
  markdown += `# Project: ${title}\n\n`;

  // Goals
  if (brief.goals.length > 0) {
    markdown += `## Goals\n\n`;
    brief.goals.forEach((goal) => {
      markdown += `- ${goal}\n`;
    });
    markdown += '\n';
  }

  // Deliverables
  if (brief.deliverables.length > 0) {
    markdown += `## Deliverables\n\n`;
    brief.deliverables.forEach((deliverable) => {
      // Find if there's a matching deadline
      const deadline = brief.deadlines.length > 0 ? brief.deadlines[0] : null;
      const dueText = deadline ? ` – due: ${deadline.dateString}` : '';

      markdown += `- ${deliverable.title}${dueText}\n`;
      if (deliverable.description) {
        markdown += `  - ${deliverable.description}\n`;
      }
    });
    markdown += '\n';
  }

  // Clarifying questions
  if (brief.clarifyingQuestions.length > 0) {
    markdown += `## Clarifying Questions\n\n`;
    brief.clarifyingQuestions.forEach((question) => {
      markdown += `- ${question}\n`;
    });
    markdown += '\n';
  }

  return markdown;
}
