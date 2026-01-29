# @ilytat/common

Shared data utility and API client for ILYTAT applications.

## Features

- **IlytatClient**: A unified facade for accessing global data.
  - `navigation`: Fetch global navigation links.
  - `quotes`: Fetch global quotes.
  - `media`: Resolve centralized media URLs (e.g., logos, hero images).
- **Data Wizard**: Interactive CLI tool to manage live data.

## Installation

```bash
npm install @ilytat/common
```

## Usage

### API Client

```typescript
import { IlytatClient } from '@ilytat/common';

const client = new IlytatClient({
  env: 'production' // or 'development'
});

// Get Navigation
const nav = await client.navigation.get();

// Get Quotes
const quotes = await client.quotes.getAll();

// Get Media URL
const logoUrl = client.media.getLogoUrl();
const heroUrl = client.media.getUrl('heroes/Male_01.png');
```

## Data Management Wizard

This package includes a CLI wizard to easily add new Quotes or Navigation items to the live dataset.

1. Navigate to the package directory:
   ```bash
   cd packages/ilytat-common
   ```

2. Run the wizard:
   ```bash
   npm run wizard
   ```

3. Follow the prompts. The tool will:
   - Fetch the latest live data.
   - Ask for your new item details.
   - Generate the updated JSON payload.
   - **Copy the result to your clipboard.**

4. Paste the clipboard content into your R2 bucket file to update it.
