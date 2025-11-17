# AI PR Risk Summary - Atlassian Forge App

A mobile-first AI-powered pull request risk analysis tool for Jira, designed for Apple Mini Apps integration.

## Overview

This Forge app provides AI-generated risk summaries for pull requests, helping teams identify security, architectural, and policy concerns before merging code. It's optimized for mobile WebViews and designed to integrate with Apple's Mini Apps Partner Program.

### Key Features

- **AI Risk Analysis**: Generate comprehensive risk summaries with severity levels
- **Policy Detection**: Automatic flagging of sensitive code areas (auth, payments, etc.)
- **Credit System**: Built-in consumption tracking ready for Apple IAP integration
- **Mobile-First UI**: Optimized for mobile WebViews and touch interactions
- **Mock & Real LLM**: Supports both mock responses and real Anthropic/OpenAI APIs

## Architecture

```
┌─────────────────────────────────────┐
│  Jira Issue Panel (Custom UI)      │
│  - Mobile-optimized React app      │
│  - Form to paste PR content        │
│  - Display risk summary            │
└────────────┬────────────────────────┘
             │ @forge/bridge
             ▼
┌─────────────────────────────────────┐
│  Forge Backend (Resolvers)          │
│  - Policy checking                  │
│  - Credit verification              │
│  - LLM integration                  │
└────────────┬────────────────────────┘
             │
      ┌──────┴──────┬──────────┐
      ▼             ▼          ▼
┌──────────┐  ┌─────────┐  ┌────────┐
│  Forge   │  │ Policy  │  │  LLM   │
│ Storage  │  │ Engine  │  │  API   │
└──────────┘  └─────────┘  └────────┘
```

## Project Structure

```
.
├── manifest.yml              # Forge app configuration
├── forge-package.json        # Dependencies for Forge app
├── tsconfig.forge.json       # TypeScript configuration
├── src/
│   ├── index.ts             # Backend resolvers (main entry)
│   ├── types.ts             # Shared TypeScript types
│   ├── policies.ts          # Policy rules engine
│   ├── creditManager.ts     # Credit consumption system
│   └── llm.ts               # LLM integration (mock + real)
└── static/
    ├── index.html           # HTML template
    ├── index.tsx            # Frontend entry point
    ├── App.tsx              # Main React component
    └── App.css              # Mobile-first styles
```

## Prerequisites

1. **Node.js 20+**
2. **Forge CLI**: Install globally
   ```bash
   npm install -g @forge/cli
   ```
3. **Atlassian Account**: With access to a Jira Cloud instance
4. **API Keys** (optional, for production):
   - Anthropic API key OR
   - OpenAI API key

## Installation

### 1. Install Dependencies

```bash
# Use the Forge-specific package.json
npm install --package-lock-only
```

### 2. Configure Manifest

Edit `manifest.yml` and update:

```yaml
app:
  id: YOUR_APP_ID_HERE  # Replace with your app ID from Atlassian Developer Console
```

### 3. Build the App

```bash
forge build
```

### 4. Deploy to Forge

```bash
# Login to Forge (first time only)
forge login

# Deploy the app
forge deploy
```

### 5. Install on Jira Site

```bash
forge install
```

Select your Jira site when prompted.

## Configuration

### LLM Integration (Production)

By default, the app uses **mock LLM responses**. To enable real AI:

#### Option A: Anthropic Claude

1. Get API key from https://console.anthropic.com/
2. Install SDK:
   ```bash
   npm install @anthropic-ai/sdk
   ```
3. Edit `src/llm.ts`:
   - Uncomment the Anthropic implementation
   - Update the main export:
     ```typescript
     export async function generateRiskSummary(input: LlmInput): Promise<RiskSummary> {
       return await generateAnthropicRiskSummary(input);
     }
     ```
4. Set environment variable:
   ```bash
   forge variables set LLM_API_KEY your_api_key_here
   forge variables set LLM_PROVIDER anthropic
   ```

#### Option B: OpenAI GPT

1. Get API key from https://platform.openai.com/
2. Install SDK:
   ```bash
   npm install openai
   ```
3. Edit `src/llm.ts`:
   - Uncomment the OpenAI implementation
   - Update the main export:
     ```typescript
     export async function generateRiskSummary(input: LlmInput): Promise<RiskSummary> {
       return await generateOpenAIRiskSummary(input);
     }
     ```
4. Set environment variable:
   ```bash
   forge variables set LLM_API_KEY your_api_key_here
   forge variables set LLM_PROVIDER openai
   ```

### Policy Rules

Edit `src/policies.ts` to customize policy rules:

```typescript
export const POLICY_RULES: PolicyRule[] = [
  {
    id: 'custom-rule',
    name: 'Your Custom Rule',
    pattern: '/your/pattern/',  // Regex or substring
    description: 'Describe what this detects',
    severity: 'HIGH'  // LOW | MEDIUM | HIGH
  },
  // Add more rules...
];
```

### Credit Configuration

Edit `src/creditManager.ts` to adjust:

- **Default credits**: `DEFAULT_CREDITS = 10000`
- **Operation costs**:
  ```typescript
  const OPERATION_COSTS: Record<CreditOperationType, number> = {
    RISK_SUMMARY: 10,   // Cost per summary
    DEEP_REVIEW: 50     // Future feature
  };
  ```

## Development

### Local Development with Tunnel

```bash
forge tunnel
```

This creates a tunnel to your local development environment, allowing you to test changes without deploying.

### View Logs

```bash
forge logs
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run type-check
```

## Usage

### In Jira

1. Open any Jira issue
2. Find the "AI PR Risk Summary" panel (usually in the right sidebar)
3. Paste PR information:
   - PR title (optional)
   - PR description
   - Code diff (optional)
   - File paths (optional)
4. Click "Generate Risk Summary"
5. Review the analysis:
   - Risk level (Low/Medium/High)
   - Key risks
   - Policy flags
   - Suggested review questions
6. Click "Copy as Markdown" to share

### Credit System

- Each account starts with **10,000 credits**
- Each risk summary costs **10 credits**
- Balance is shown after each analysis
- When credits run out, the app shows an error

**Future**: Credits will be purchasable via Apple In-App Purchases.

## Apple Mini Apps Integration (Future)

This app is designed to qualify for Apple's Mini Apps Partner Program:

### Current Status
✅ Mobile-first, responsive UI
✅ Single-column layout optimized for WebViews
✅ Touch-friendly interactions
✅ Credit consumption layer ready for IAP
✅ Focused, actionable content

### To Enable IAP
1. Implement IAP purchase flow in frontend
2. Add webhook handler for purchase verification
3. Call `addCredits()` from `creditManager.ts` when purchase completes
4. Add subscription tiers (if applicable)

## API Reference

### Backend Resolvers

#### `generateRiskSummary`
Generates AI risk analysis for PR.

**Request:**
```typescript
{
  prTitle?: string;
  prDescription?: string;
  diffText?: string;
  filesChanged?: string[];
}
```

**Response:**
```typescript
{
  success: true;
  summary: RiskSummary;
  credits: {
    remainingCredits: number;
    operationCost: number;
  };
}
```

#### `getCredits`
Gets current credit balance.

**Response:**
```typescript
{
  success: true;
  balance: {
    remainingCredits: number;
    softLimit?: number;
    hardLimit?: number;
  };
}
```

#### `ping`
Health check endpoint.

## Troubleshooting

### "Insufficient credits" error
- Check credit balance with `getCredits` resolver
- For testing, manually add credits via Forge storage
- In production, implement IAP purchase flow

### LLM errors
- Verify `LLM_API_KEY` is set: `forge variables list`
- Check API key validity
- Review logs: `forge logs`
- Ensure SDK is installed (`@anthropic-ai/sdk` or `openai`)

### UI not loading
- Verify build completed: `forge build`
- Check manifest.yml resource paths
- View browser console for errors
- Try `forge tunnel` for local debugging

### Policy rules not matching
- Check regex syntax in `src/policies.ts`
- Test patterns against sample file paths
- Use simple substring matching for easier debugging

## Roadmap

### v1.0 (Current)
- ✅ Basic risk summary generation
- ✅ Policy rule detection
- ✅ Credit consumption tracking
- ✅ Mobile-optimized UI

### v1.1 (Planned)
- [ ] Bitbucket integration
- [ ] Direct PR linking from Jira
- [ ] Historical analysis tracking
- [ ] Admin dashboard for credit management

### v2.0 (Future)
- [ ] Apple IAP integration
- [ ] Subscription tiers
- [ ] Advanced policy customization
- [ ] Team analytics and reporting

## Support

For issues or questions:
1. Check the [Forge documentation](https://developer.atlassian.com/platform/forge/)
2. Review Forge CLI help: `forge help`
3. Enable debug logging: `forge logs --follow`

## License

MIT

---

**Built with Atlassian Forge** | **Powered by AI** | **Apple Mini App Ready**
