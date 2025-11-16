# Project Brief Analyst / RFP De-Coder

A web application that analyzes project briefs, RFPs, and client emails to extract structured information and automatically create tasks in ClickUp.

## Features

- **Intelligent Text Analysis**: Paste any project brief, RFP, or client email and get structured information extracted automatically
- **LLM-Powered Extraction**: Uses AI to identify:
  - Project summary
  - Goals and objectives
  - Deliverables
  - Deadlines
  - Stakeholders
  - Clarifying questions
- **ClickUp Integration**: Create tasks directly in ClickUp from extracted deliverables
- **Markdown Export**: Copy the analysis as formatted Markdown for documentation

## Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **APIs**:
  - LLM API (Anthropic Claude or OpenAI)
  - ClickUp API

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- An LLM API key (Anthropic Claude or OpenAI)
- (Optional) ClickUp Personal API Token for task creation

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd RFP-Analyzer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` and add your LLM API key:
```
LLM_API_KEY=your_actual_api_key_here
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## LLM Integration

The app currently uses a **placeholder LLM integration** in `app/api/analyze-brief/route.ts`. You need to plug in your actual LLM client.

### Option 1: Anthropic Claude (Recommended)

1. Install the SDK:
```bash
npm install @anthropic-ai/sdk
```

2. Get your API key from [https://console.anthropic.com/](https://console.anthropic.com/)

3. Uncomment and configure the Anthropic integration in `app/api/analyze-brief/route.ts` (see comments in the file)

### Option 2: OpenAI

1. Install the SDK:
```bash
npm install openai
```

2. Get your API key from [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

3. Uncomment and configure the OpenAI integration in `app/api/analyze-brief/route.ts` (see comments in the file)

## ClickUp Integration

To create tasks in ClickUp:

1. Get your ClickUp Personal API Token:
   - Go to ClickUp Settings → Apps
   - Click "Generate" under API Token
   - Copy the token

2. Get your List ID:
   - Open the ClickUp list where you want to create tasks
   - The List ID is in the URL: `https://app.clickup.com/{workspace_id}/v/li/{list_id}`

3. In the app UI:
   - Paste your API token in the "ClickUp API Token" field
   - Paste your List ID in the "List ID" field
   - Click "Create Tasks in ClickUp"

## Project Structure

```
RFP-Analyzer/
├── app/
│   ├── api/
│   │   ├── analyze-brief/
│   │   │   └── route.ts          # LLM analysis endpoint
│   │   └── clickup/
│   │       └── create-tasks/
│   │           └── route.ts      # ClickUp task creation endpoint
│   ├── globals.css               # Global styles with Tailwind
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main UI page
├── lib/
│   └── types.ts                  # Shared TypeScript types
├── .env.example                  # Environment variables template
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Key Files

### `lib/types.ts`
Defines the `ExtractedBrief` type and all API request/response types. This is shared across frontend and backend.

### `app/api/analyze-brief/route.ts`
API route that:
- Accepts text input
- Calls LLM with structured prompt
- Returns extracted brief as JSON

**Important**: You must plug in your actual LLM client here. See the TODO comments in the file.

### `app/api/clickup/create-tasks/route.ts`
API route that:
- Accepts brief data, ClickUp token, and List ID
- Creates one task per deliverable
- Returns success/error status

### `app/page.tsx`
Main UI with:
- Text input area
- "Analyze Brief" button
- Structured output display
- "Copy as Markdown" functionality
- ClickUp integration panel

## Deployment

### Deploy to Vercel

1. Push your code to GitHub

2. Import your repository in Vercel

3. Add environment variables in Vercel:
   - Go to Project Settings → Environment Variables
   - Add `LLM_API_KEY` with your actual API key
   - Select Production, Preview, and Development environments

4. Deploy!

The app will be live at your Vercel URL.

## Usage

1. **Paste a project brief**: Copy any RFP, client email, or project description into the text area

2. **Click "Analyze Brief"**: The app will extract structured information using AI

3. **Review the analysis**: See extracted goals, deliverables, deadlines, stakeholders, and clarifying questions

4. **Copy as Markdown**: Click to copy the analysis in Markdown format

5. **Create ClickUp tasks** (optional):
   - Enter your ClickUp API token
   - Enter the List ID where tasks should be created
   - Click "Create Tasks in ClickUp"
   - One task will be created for each deliverable

## Future Enhancements

- [ ] File upload support (PDF, DOCX)
- [ ] ClickUp OAuth integration
- [ ] Save/load analyzed briefs
- [ ] Custom field mapping for ClickUp tasks
- [ ] Support for multiple project management tools
- [ ] Team collaboration features
- [ ] Template management for different project types

## Troubleshooting

### "LLM_API_KEY environment variable is not set"
- Make sure you created `.env.local` with your API key
- Restart the development server after adding the key

### "Failed to parse LLM output as valid JSON"
- Check that your LLM is configured correctly
- Verify the system prompt is instructing the LLM to return JSON only
- Check the console logs for the actual LLM response

### ClickUp API errors
- Verify your API token is correct
- Check that the List ID is valid
- Ensure you have permission to create tasks in that list

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
