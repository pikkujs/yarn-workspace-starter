# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pikku is a TypeScript-powered framework that normalizes all the different ways you can interact with Node.js servers. It provides a unified approach to handling HTTP requests, WebSocket connections, scheduled tasks, and channels across different runtime environments (Express, Fastify, Next.js, AWS Lambda, Cloudflare Workers, etc.).

## Architecture

### Core Components

- **@pikku/core**: The main framework containing HTTP handlers, channel handlers, schedulers, services, and middleware
- **@pikku/cli**: Code generation tool that creates type-safe clients and server wrappers from your function definitions
- **@pikku/client-fetch**: Type-safe HTTP client generated from your API definitions
- **@pikku/client-websocket**: Type-safe WebSocket client for real-time communication
- **Runtime packages**: Adapters for different environments (Express, Fastify, Next.js, AWS Lambda, etc.)

### Project Structure

This repository contains multiple sub-projects:
- `pikku/`: Main monorepo with all Pikku packages
- `nextjs-app-starter/`: Example Next.js integration
- `workspace-starter/`: Full-featured example with multiple backend and frontend apps
- `website/`: Documentation site (Docusaurus)
- `presentation/`: Reveal.js presentation

### Key Concepts

- **pikkuFunc**: Core abstraction that handles data from params, query, or body without needing to know the source
- **Services**: Initialized at server startup and available to all functions (JWT, logger, schema validation, etc.)
- **Channels**: WebSocket-like real-time communication with pub/sub capabilities
- **Schedulers**: Cron-like scheduled task execution
- **Type Generation**: Automatic generation of type-safe clients from server definitions

## Development Commands

### Main Pikku Framework (pikku/)

```bash
# Install dependencies
yarn

# Type checking
yarn tsc

# Build all packages
yarn build

# Run tests
yarn test

# Run tests with coverage
yarn test:coverage

# Lint code
yarn lint

# Format code
yarn prettier

# Generate documentation
yarn typedoc

# Create changeset (for PRs)
yarn changeset

# Publish release
yarn release
```

### Individual Package Testing

Each package has its own test runner:
```bash
# Run tests for a specific package
./run-tests.sh

# Run tests in watch mode
./run-tests.sh --watch

# Run tests with coverage
./run-tests.sh --coverage
```

### Next.js App Starter

```bash
# Install dependencies
npm install

# Prepare build (generates Pikku types)
npm run prebuild

# Start development server
npm run start
```

### Workspace Starter

```bash
# Install dependencies
yarn install

# Generate types and setup
yarn prebuild

# Start specific backend (Express example)
cd backends/express && yarn start

# Start Next.js app
cd apps/next-app && yarn dev
```

## Configuration

### pikku.config.json

This is the main configuration file for Pikku projects:
- `srcDirectories`: Where to find your function definitions
- `outDir`: Where to generate output files
- `packageMappings`: Map local packages to published package names
- `openAPI`: OpenAPI specification generation settings

Example structure:
```json
{
  "tsconfig": "./tsconfig.json",
  "srcDirectories": ["src"],
  "outDir": ".pikku",
  "fetchFile": "pikku-fetch.gen.ts",
  "websocketFile": "pikku-websocket.gen.ts"
}
```

## Code Generation

Pikku uses a CLI tool to generate type-safe clients and server code:
- Run `npx pikku prebuild` or `yarn prebuild` to generate types
- Generated files include HTTP clients, WebSocket clients, and type definitions
- Always run prebuild after modifying function definitions

## Testing

- Uses Node.js built-in test runner with tsx for TypeScript support
- Test files follow `*.test.ts` pattern
- Each package has isolated tests
- Coverage reports generated with `--experimental-test-coverage`

## Workspace Structure

This is a Yarn workspace monorepo with:
- `packages/`: Core Pikku packages
- `templates/`: Example templates for different runtimes
- Strict TypeScript configuration with comprehensive type checking
- Husky pre-commit hooks for code quality

# agent-rule-validation
CRITICAL: Before generating ANY code, Claude MUST validate against agent rules to ensure automated code generation works correctly.

## Pre-Code-Generation Process (MANDATORY)

1. **Load Agent Rules**: Read `agent/extracted-rules.md` for the consolidated list of CRITICAL rules
2. **Rule Validation**: Check ALL generated/modified code against these rules BEFORE responding
3. **Auto-Correction**: If violations are found, automatically fix them following the rules
4. **Verification**: Double-check that the final code follows ALL agent rules

## Critical Rules Summary (Always Check)

- ✅ No manual auth checks - use `pikkuFunc` instead of `pikkuSessionlessFunc` with session checks
- ✅ Services destructured in parameter list: `({ kysely }, data)` NOT `(services, data) => { const { kysely } = services }`  
- ✅ Import `pikkuFunc` from `#pikku/pikku-types.gen.js`, never from `@pikku/core`
- ✅ All TypeScript types and Kysely queries use camelCase (not snake_case)
- ✅ Database types imported directly from `.generated/database-types-pure.js`
- ✅ Joined queries use pattern: `BaseType & { related: Pick<RelatedType, 'field1' | 'field2'> }`

## Rule Violation Response

If Claude detects any rule violations in existing code during modification:
1. Point out the violation 
2. Automatically fix it according to agent rules
3. Explain why the change was necessary for automated code generation

This ensures consistent, rule-following code that works reliably with automated generation.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.