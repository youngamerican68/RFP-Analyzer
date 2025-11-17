/**
 * Main App Component - AI PR Risk Summary
 *
 * Mobile-first UI for generating AI-powered PR risk assessments.
 * Designed to work inside Jira mobile WebViews and Apple Mini Apps.
 */

import React, { useState } from 'react';
import { invoke } from '@forge/bridge';
import './App.css';

// Type definitions (mirrored from backend)
interface RiskSummary {
  summary: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  risks: string[];
  policyFlags: string[];
  suggestedQuestions: string[];
}

interface RiskSummaryResponse {
  success: boolean;
  summary?: RiskSummary;
  credits?: {
    remainingCredits: number;
    operationCost: number;
  };
  error?: string;
  message?: string;
  remainingCredits?: number;
}

const App: React.FC = () => {
  // Form state
  const [prTitle, setPrTitle] = useState('');
  const [prDescription, setPrDescription] = useState('');
  const [diffText, setDiffText] = useState('');
  const [filesChanged, setFilesChanged] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RiskSummaryResponse | null>(null);

  /**
   * Call backend to generate risk summary
   */
  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);

    try {
      const filesArray = filesChanged
        .split(',')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const response = await invoke<RiskSummaryResponse>('generateRiskSummary', {
        prTitle: prTitle || undefined,
        prDescription: prDescription || undefined,
        diffText: diffText || undefined,
        filesChanged: filesArray.length > 0 ? filesArray : undefined
      });

      setResult(response);
    } catch (error) {
      console.error('Error calling backend:', error);
      setResult({
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Failed to connect to backend. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copy result as markdown to clipboard
   */
  const handleCopyMarkdown = () => {
    if (!result || !result.success || !result.summary) return;

    const { summary } = result;
    const markdown = `### AI PR Risk Summary

**Risk Level:** ${summary.riskLevel}

**Summary:**
${summary.summary}

**Key Risks:**
${summary.risks.map(r => `- ${r}`).join('\n')}

${summary.policyFlags.length > 0 ? `**Policy Flags:**
${summary.policyFlags.map(p => `- ${p}`).join('\n')}
` : ''}
**Suggested Review Questions:**
${summary.suggestedQuestions.map(q => `- ${q}`).join('\n')}
`;

    navigator.clipboard.writeText(markdown).then(() => {
      alert('Copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy:', err);
    });
  };

  /**
   * Get risk level color
   */
  const getRiskColor = (level: string): string => {
    switch (level) {
      case 'HIGH': return '#d32f2f';
      case 'MEDIUM': return '#f57c00';
      case 'LOW': return '#388e3c';
      default: return '#666';
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>AI PR Risk Summary</h1>
        <p className="subtitle">
          Get AI-powered risk analysis for your pull requests
        </p>
      </header>

      <div className="form-section">
        <div className="form-group">
          <label htmlFor="prTitle">PR Title (Optional)</label>
          <input
            id="prTitle"
            type="text"
            value={prTitle}
            onChange={(e) => setPrTitle(e.target.value)}
            placeholder="e.g., Add user authentication"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="prDescription">PR Description</label>
          <textarea
            id="prDescription"
            value={prDescription}
            onChange={(e) => setPrDescription(e.target.value)}
            placeholder="Paste PR description or summary of changes..."
            rows={4}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="diffText">Code Diff (Optional)</label>
          <textarea
            id="diffText"
            value={diffText}
            onChange={(e) => setDiffText(e.target.value)}
            placeholder="Paste git diff or code snippet..."
            rows={6}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="filesChanged">Files Changed (Optional)</label>
          <input
            id="filesChanged"
            type="text"
            value={filesChanged}
            onChange={(e) => setFilesChanged(e.target.value)}
            placeholder="e.g., src/auth/login.ts, src/api/users.ts"
            disabled={loading}
          />
          <small className="form-hint">Comma-separated file paths</small>
        </div>

        <button
          className="btn-primary"
          onClick={handleGenerate}
          disabled={loading || (!prDescription && !diffText)}
        >
          {loading ? 'Generating...' : 'Generate Risk Summary'}
        </button>
      </div>

      {/* Results Section */}
      {result && (
        <div className="results-section">
          {result.success && result.summary ? (
            <>
              <div className="result-header">
                <h2>Risk Analysis</h2>
                <div
                  className="risk-badge"
                  style={{ backgroundColor: getRiskColor(result.summary.riskLevel) }}
                >
                  {result.summary.riskLevel} RISK
                </div>
              </div>

              <div className="result-content">
                <div className="section">
                  <h3>Summary</h3>
                  <p>{result.summary.summary}</p>
                </div>

                <div className="section">
                  <h3>Key Risks</h3>
                  <ul>
                    {result.summary.risks.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                </div>

                {result.summary.policyFlags.length > 0 && (
                  <div className="section">
                    <h3>Policy Flags</h3>
                    <div className="policy-flags">
                      {result.summary.policyFlags.map((flag, idx) => (
                        <span key={idx} className="policy-flag">
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="section">
                  <h3>Suggested Review Questions</h3>
                  <ul>
                    {result.summary.suggestedQuestions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {result.credits && (
                <div className="credits-info">
                  This analysis used {result.credits.operationCost} credits.
                  Remaining: {result.credits.remainingCredits}
                </div>
              )}

              <button
                className="btn-secondary"
                onClick={handleCopyMarkdown}
              >
                Copy as Markdown
              </button>
            </>
          ) : (
            <div className="error-message">
              <h3>Error</h3>
              <p>{result.message || 'An error occurred'}</p>
              {result.error === 'INSUFFICIENT_CREDITS' && result.remainingCredits !== undefined && (
                <p className="credits-info">
                  Current balance: {result.remainingCredits} credits
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <footer className="app-footer">
        <p>
          Powered by AI • Mobile-optimized • Apple Mini App Ready
        </p>
      </footer>
    </div>
  );
};

export default App;
