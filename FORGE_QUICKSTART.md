# Quick Start: AI PR Risk Summary Forge App

Get up and running in 5 minutes with mock LLM responses.

## Prerequisites

- Node.js 20+
- Forge CLI: `npm install -g @forge/cli`
- Atlassian Developer account

## Setup Steps

### 1. Install Forge CLI (if not already installed)

```bash
npm install -g @forge/cli
```

### 2. Login to Forge

```bash
forge login
```

This will open a browser for authentication.

### 3. Register Your App

First time only - get an app ID:

```bash
forge register
```

This creates a new app in the Atlassian Developer Console and updates `manifest.yml` with your app ID.

### 4. Build the App

```bash
forge build
```

### 5. Deploy to Development

```bash
forge deploy --environment development
```

### 6. Install on Your Jira Site

```bash
forge install
```

Select your Jira Cloud site when prompted.

### 7. Test It!

1. Go to your Jira site
2. Open any issue
3. Look for "AI PR Risk Summary" panel in the right sidebar
4. Paste some PR information and click "Generate Risk Summary"

## What You'll See

The app will generate a **mock** risk summary showing:
- Risk level (Low/Medium/High)
- Summary of changes
- Key risks identified
- Policy flags (if patterns match)
- Suggested review questions

## Enable Real LLM (Optional)

To use Anthropic Claude or OpenAI:

1. Get an API key
2. Install SDK: `npm install @anthropic-ai/sdk` or `npm install openai`
3. Edit `src/llm.ts` to uncomment your provider
4. Set API key: `forge variables set LLM_API_KEY your_key`
5. Redeploy: `forge deploy`

See [FORGE_APP_README.md](FORGE_APP_README.md) for detailed instructions.

## Development Workflow

### Make Changes

Edit files in `src/` or `static/`

### Test Locally

```bash
forge tunnel
```

This runs your local code against the installed app (hot reload).

### View Logs

```bash
forge logs
```

### Deploy Updates

```bash
forge deploy
```

### Uninstall (if needed)

```bash
forge uninstall
```

## Common Commands

| Command | Description |
|---------|-------------|
| `forge build` | Build the app |
| `forge deploy` | Deploy to Forge |
| `forge install` | Install on Jira site |
| `forge uninstall` | Remove from Jira site |
| `forge tunnel` | Local development mode |
| `forge logs` | View app logs |
| `forge variables list` | List environment variables |
| `forge variables set KEY value` | Set environment variable |

## File Structure

```
├── manifest.yml              ← Forge configuration
├── forge-package.json        ← Dependencies
├── src/
│   ├── index.ts             ← Backend API
│   ├── types.ts             ← Shared types
│   ├── policies.ts          ← Policy rules
│   ├── creditManager.ts     ← Credit system
│   └── llm.ts               ← LLM integration
└── static/
    ├── index.html
    ├── index.tsx
    ├── App.tsx              ← React UI
    └── App.css
```

## Customization

### Add Policy Rules

Edit `src/policies.ts`:

```typescript
{
  id: 'my-rule',
  name: 'My Custom Rule',
  pattern: '/my/pattern/',
  description: 'What this detects',
  severity: 'HIGH'
}
```

### Adjust Credits

Edit `src/creditManager.ts`:

```typescript
const DEFAULT_CREDITS = 10000;  // Starting balance
const OPERATION_COSTS = {
  RISK_SUMMARY: 10  // Cost per summary
};
```

## Troubleshooting

### Can't find the panel
- Refresh Jira
- Check the right sidebar
- Try a different issue

### Build errors
- Run `npm install` first
- Check Node.js version (need 20+)

### Deploy fails
- Run `forge login` again
- Check app ID in manifest.yml
- Try `forge deploy --verbose`

## Next Steps

1. ✅ Test with mock responses
2. Add your own policy rules
3. Customize the UI styling
4. Enable real LLM for production
5. Add Bitbucket integration
6. Implement Apple IAP (future)

## Support

- Full docs: [FORGE_APP_README.md](FORGE_APP_README.md)
- Forge docs: https://developer.atlassian.com/platform/forge/
- Get help: `forge help`

---

Happy coding! 🚀
