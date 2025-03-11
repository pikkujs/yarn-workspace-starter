# Workspace Starter

Welcome to the **Pikku Workspace Starter**!

This repository contains a variety of packages designed to test all the different functionality in Pikku.

You can see more indepth documentation [here](https://pikku.dev/docs/workspace/workspaces)

## Requirements

- **Node.js 18**
- **PostgreSQL database**
- An environment variable with your host, user, and password:

  ```bash
  POSTGRES_CREDENTIALS='{"host":"localhost","port":5432,"user":"postgres","password":"password","database":"pikku_workspace_starter"}'
  ```

## Setup

To get started, run:

```bash
yarn install
yarn prebuild
```

## Apps

### `apps/cli`

This app tests the Pikku fetch functionality.

### `apps/next-app`

A Next.js App Router integrated with Pikku.

## Backends

### `backends/express`

An Express backend setup using Pikku.

### `backends/fastify`

A Fastify backend setup using Pikku.

### `backends/uws`

A uWS (µWebSockets) backend setup using Pikku.

## Packages

### `functions`

Contains all the Pikku routes, functions, and services.

### `sdk`

Contains shared types used by both the backend and frontend.

## Docker

Dockerfiles for the different services we created.

## SQL

Contains all the migration files used for setting up the SQL database.

---

Feel free to explore each package and customize the starter to fit your project's needs. Happy coding!
