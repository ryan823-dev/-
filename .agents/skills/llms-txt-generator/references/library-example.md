# Generic Library Pattern

## Recommended Files

```
llm-docs/
├── llm.txt              # Library overview
├── llm.version.txt      # Version and compatibility
├── llm.api.txt          # Public API reference
├── llm.internals.txt    # Internal architecture
├── llm.patterns.txt     # Common usage patterns
└── llm.examples.txt     # Code examples
```

## Data Sources

| Source | Extraction Method |
|--------|-------------------|
| TypeScript definitions | Parse .d.ts files |
| JSDoc comments | Extract from source |
| package.json | Read exports and dependencies |
| README | Incorporate existing docs |

## llm.api.txt Example

```markdown
# Public API - {Library}

## Installation

\`\`\`bash
npm install {library-name}
# or
yarn add {library-name}
\`\`\`

## Exports

\`\`\`typescript
import {
  // Core
  createClient,
  Client,

  // Utilities
  format,
  parse,
  validate,

  // Types
  Options,
  Result,
  Error
} from '{library-name}';
\`\`\`

## Core Functions

### createClient(options)

Create a new client instance.

**Parameters:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| options | Options | yes | - | Configuration object |

**Returns:** `Client`

**Example:**
\`\`\`typescript
const client = createClient({
  apiKey: 'xxx',
  timeout: 5000
});
\`\`\`

### format(value, template)

Format a value using a template string.

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| value | any | Value to format |
| template | string | Template pattern |

**Returns:** `string`

### parse(input)

Parse a string into structured data.

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| input | string | Input to parse |

**Returns:** `Result<T>` - Parsed result or error

**Throws:** `ParseError` if input is malformed

## Types

### Options

\`\`\`typescript
type Options = {
  apiKey: string;
  timeout?: number;      // default: 10000
  retries?: number;      // default: 3
  baseUrl?: string;      // default: production URL
  debug?: boolean;       // default: false
};
\`\`\`

### Result<T>

\`\`\`typescript
type Result<T> =
  | { success: true; data: T }
  | { success: false; error: Error };
\`\`\`

### Error

\`\`\`typescript
type Error = {
  code: string;
  message: string;
  cause?: unknown;
};
\`\`\`
```

## llm.internals.txt Example

```markdown
# Internal Architecture - {Library}

## Module Structure

\`\`\`
src/
├── index.ts           # Public exports
├── client/            # Client implementation
│   ├── client.ts      # Main client class
│   ├── http.ts        # HTTP layer
│   └── retry.ts       # Retry logic
├── utils/             # Utility functions
│   ├── format.ts
│   ├── parse.ts
│   └── validate.ts
├── types/             # Type definitions
│   ├── options.ts
│   ├── result.ts
│   └── errors.ts
└── constants/         # Configuration
    └── defaults.ts
```

## Key Abstractions

### HttpAdapter

Internal HTTP handling with retry support.

\`\`\`typescript
interface HttpAdapter {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body: unknown): Promise<T>;
}
\`\`\`

### Cache

Optional caching layer.

\`\`\`typescript
interface Cache {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttl?: number): void;
  invalidate(pattern: string): void;
}
\`\`\`

## Extension Points

- `HttpAdapter`: Customize HTTP behavior
- `Cache`: Provide custom caching
- `Logger`: Custom logging integration
```

## llm.patterns.txt Example

```markdown
# Usage Patterns - {Library}

## Basic Usage

\`\`\`typescript
import { createClient } from '{library-name}';

const client = createClient({ apiKey: process.env.API_KEY });

const result = await client.fetch('resource');
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
\`\`\`

## Error Handling

\`\`\`typescript
import { createClient, isNetworkError, isValidationError } from '{library-name}';

try {
  const data = await client.fetch('resource');
} catch (error) {
  if (isNetworkError(error)) {
    // Retry or show offline message
  } else if (isValidationError(error)) {
    // Show validation feedback
  } else {
    // Unknown error
    throw error;
  }
}
\`\`\`

## With TypeScript

\`\`\`typescript
import { createClient, Result } from '{library-name}';

interface User {
  id: string;
  name: string;
}

const client = createClient<User>({ apiKey: 'xxx' });
const result: Result<User[]> = await client.list();
\`\`\`

## Testing

\`\`\`typescript
import { createMockClient } from '{library-name}/testing';

const mockClient = createMockClient();
mockClient.onFetch('resource').reply({ id: '1', name: 'Test' });

// Use mockClient in tests
\`\`\`

## Framework Integration

### React

\`\`\`typescript
import { ClientProvider, useClient } from '{library-name}/react';

function App() {
  return (
    <ClientProvider apiKey="xxx">
      <MyComponent />
    </ClientProvider>
  );
}

function MyComponent() {
  const client = useClient();
  // ...
}
\`\`\`

### Node.js

\`\`\`typescript
import { createClient } from '{library-name}';

// Singleton pattern
let client: Client;

export function getClient() {
  if (!client) {
    client = createClient({ apiKey: process.env.API_KEY });
  }
  return client;
}
\`\`\`
```
