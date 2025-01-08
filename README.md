# Workspace Starter

Welcome to the **Vramework Workspace Starter**!

This repository contains a variety of packages designed to test all the different functionality in Vramework.

You can see more indepth documentation [here](https://vramework.dev/docs/workspace/workspaces)

## Requirements

- **Node.js 18**
- **PostgreSQL database**
- An environment variable with your host, user, and password:

  ```bash
  POSTGRES_CREDENTIALS='{"host":"localhost","port":5432,"user":"postgres","password":"password","database":"vramework_workspace_starter"}'
  ```

## Setup

To get started, run:

```bash
yarn install
yarn prebuild
```

## Apps

### `apps/cli`

This app tests the Vramework fetch functionality.

### `apps/next-app`

A Next.js App Router integrated with Vramework.

### `apps/next-pages`

A Next.js Pages Router integrated with Vramework.

## Backends

### `backends/express`

An Express backend setup using Vramework.

### `backends/fastify`

A Fastify backend setup using Vramework.

### `backends/uws`

A uWS (µWebSockets) backend setup using Vramework.

## Packages

### `components`

Shared React components for the app and pages.

### `functions`

Contains all the Vramework routes, functions, and services.

### `sdk`

Contains shared types used by both the backend and frontend.

## Docker

Dockerfiles for the different services we created.

## SQL

Contains all the migration files used for setting up the SQL database.

---

Feel free to explore each package and customize the starter to fit your project's needs. Happy coding!
