# CLI Tool Pattern

Example based on nebulactl documentation.

## Recommended Files

```
llm-docs/
├── llm.txt              # Architecture overview
├── llm.version.txt      # Version tracking
├── llm.commands.txt     # CLI command structure
├── llm.core.txt         # Core services and logic
├── llm.gateway.txt      # API/external integrations
├── llm.deployment.txt   # Deployment patterns
├── llm.resources.txt    # Resource management
├── llm.testing.txt      # Testing patterns
└── llm.usage.txt        # Examples and workflows
```

## Data Sources

| Source | Extraction Method |
|--------|-------------------|
| Cobra/urfave commands | Parse cmd/ directory structure |
| Go struct tags | Extract from model definitions |
| README/docs | Incorporate existing documentation |
| Config files | Parse YAML/JSON schemas |

## llm.commands.txt Example

```markdown
# CLI Commands - {Project}

## Command Structure

\`\`\`
{cli-name}
├── version          # Show version info
├── config           # Configuration management
│   ├── init         # Initialize config
│   ├── show         # Display current config
│   └── set          # Update config values
├── resource         # Resource operations
│   ├── list         # List resources
│   ├── get          # Get resource details
│   ├── create       # Create new resource
│   ├── update       # Update resource
│   └── delete       # Delete resource
└── deploy           # Deployment commands
    ├── start        # Start deployment
    ├── status       # Check status
    └── rollback     # Rollback deployment
\`\`\`

## Global Flags

| Flag | Short | Type | Description |
|------|-------|------|-------------|
| --config | -c | string | Config file path |
| --verbose | -v | bool | Enable verbose output |
| --output | -o | string | Output format (json\|yaml\|table) |
| --timeout | -t | duration | Request timeout |

## Commands Detail

### resource list

List all resources with optional filtering.

**Usage:**
\`\`\`bash
{cli-name} resource list [flags]
\`\`\`

**Flags:**
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| --filter | string | "" | Filter expression |
| --limit | int | 100 | Max results |
| --sort | string | "name" | Sort field |

**Examples:**
\`\`\`bash
# List all resources
{cli-name} resource list

# List with filter
{cli-name} resource list --filter "status=active"

# JSON output
{cli-name} resource list -o json
\`\`\`
```

## llm.core.txt Example

```markdown
# Core Services - {Project}

## Architecture

\`\`\`
internal/
├── config/          # Configuration loading
├── client/          # API client
├── models/          # Data models
├── services/        # Business logic
└── utils/           # Shared utilities
\`\`\`

## Key Interfaces

### Client

\`\`\`go
type Client interface {
    Get(ctx context.Context, id string) (*Resource, error)
    List(ctx context.Context, opts ListOptions) ([]Resource, error)
    Create(ctx context.Context, r *Resource) error
    Update(ctx context.Context, r *Resource) error
    Delete(ctx context.Context, id string) error
}
\`\`\`

### Configuration

\`\`\`go
type Config struct {
    Endpoint string `yaml:"endpoint"`
    Token    string `yaml:"token"`
    Timeout  int    `yaml:"timeout"`
}
\`\`\`

## Error Handling

| Error Code | Meaning | Resolution |
|------------|---------|------------|
| ErrNotFound | Resource not found | Verify resource ID |
| ErrUnauthorized | Invalid credentials | Check token |
| ErrTimeout | Request timeout | Increase timeout |
```

## llm.usage.txt Example

```markdown
# Usage Examples - {Project}

## Quick Start

\`\`\`bash
# Install
go install github.com/org/{cli-name}@latest

# Initialize config
{cli-name} config init

# Verify setup
{cli-name} version
\`\`\`

## Common Workflows

### Deploy a New Service

\`\`\`bash
# 1. Create resource definition
cat > service.yaml << EOF
name: my-service
replicas: 3
image: myapp:v1.0
EOF

# 2. Create the resource
{cli-name} resource create -f service.yaml

# 3. Start deployment
{cli-name} deploy start my-service

# 4. Monitor status
{cli-name} deploy status my-service
\`\`\`

### Troubleshooting

\`\`\`bash
# Enable debug output
{cli-name} --verbose resource list

# Check connectivity
{cli-name} config show
\`\`\`
```
