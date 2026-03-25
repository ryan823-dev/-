# Frontend/UI Library Pattern

Example based on EVA Design System documentation.

## Recommended Files

```
llm-docs/
├── llm.txt                      # Index with component overview
├── llm.version.txt              # Version and component count
├── llm.tokens.txt               # Design tokens (colors, spacing, typography)
├── llm.utilities.txt            # Utility classes and HOC props
├── llm.styles.txt               # SCSS mixins and functions
├── llm.brands.txt               # Multi-brand/theming support
├── llm.components-atoms.txt     # Basic building blocks
├── llm.components-molecules.txt # Composite components
└── llm.components-organisms.txt # Complex UI patterns
```

## Data Sources

| Source | Extraction Method |
|--------|-------------------|
| Component PropTypes/TypeScript | Parse with react-docgen or ts-morph |
| SCSS variables | Regex parse `$variable: value` patterns |
| JSON metadata | Direct read from component/*.json |
| JSDoc comments | Extract from component header comments |

## llm.tokens.txt Example

```markdown
# Design Tokens - {Project}

## Colors

| Token | Value | Usage |
|-------|-------|-------|
| --color-primary | #1a73e8 | Primary actions, links |
| --color-secondary | #5f6368 | Secondary text |
| --color-error | #d93025 | Error states |

## Spacing

Base unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| --spacing-xs | 4px | Tight spacing |
| --spacing-sm | 8px | Default gap |
| --spacing-md | 16px | Section spacing |
| --spacing-lg | 24px | Large gaps |

## Typography

| Scale | Size | Line Height | Usage |
|-------|------|-------------|-------|
| xs | 11px | 16px | Captions |
| sm | 13px | 20px | Body small |
| md | 15px | 24px | Body default |
| lg | 18px | 28px | Subheadings |
```

## llm.components-atoms.txt Example

```markdown
# Atomic Components - {Project}

## Button

Primary action element.

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| variant | 'primary' \| 'secondary' \| 'ghost' | yes | - | Visual style |
| size | 'sm' \| 'md' \| 'lg' | yes | - | Button size |
| disabled | boolean | no | false | Disable interactions |
| onClick | () => void | no | - | Click handler |

### Usage

\`\`\`jsx
import { Button } from '@company/ui';

<Button variant="primary" size="md">
  Click me
</Button>
\`\`\`

### Dependencies
- Icon (optional)

---

## Input

Text input field.

### Props
...
```

## Generator Script Pattern

```javascript
const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = './src/components';
const OUTPUT_DIR = './llm-docs';

function extractComponents() {
  const dirs = fs.readdirSync(COMPONENTS_DIR);
  return dirs.map(dir => {
    const jsonPath = path.join(COMPONENTS_DIR, dir, `${dir.toLowerCase()}.json`);
    if (fs.existsSync(jsonPath)) {
      return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    }
    return null;
  }).filter(Boolean);
}

function extractColors() {
  const scss = fs.readFileSync('./src/styles/variables/_colors.scss', 'utf-8');
  const regex = /\$([a-z-]+):\s*([^;]+);/g;
  const colors = [];
  // Use matchAll for safe iteration
  for (const match of scss.matchAll(regex)) {
    colors.push({ name: match[1], value: match[2].trim() });
  }
  return colors;
}

function generateComponentsByType(components, type) {
  const filtered = components.filter(c => c.type === type);
  let content = `# ${type.charAt(0).toUpperCase() + type.slice(1)} Components\n\n`;

  for (const comp of filtered) {
    content += `## ${comp.displayName}\n\n`;
    content += `${comp.description}\n\n`;
    content += `### Props\n\n`;
    content += `| Prop | Type | Required | Description |\n`;
    content += `|------|------|----------|-------------|\n`;

    for (const [name, prop] of Object.entries(comp.props || {})) {
      const typeName = prop.type?.name || 'any';
      const required = prop.required ? 'yes' : 'no';
      content += `| ${name} | ${typeName} | ${required} | ${prop.description || '-'} |\n`;
    }
    content += '\n---\n\n';
  }

  return content;
}
```
