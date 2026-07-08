# MCP Decision Guide

Use this guide before recommending a new MCP server.

## Default

Do not install or configure MCP by default. Most one-time task-planning flows can use local file reads, web browsing, Chrome logged-in state, or exported artifacts.

## Recommend MCP When

Recommend MCP only when all of these are true:

1. The task needs repeated access to the same external system.
2. The user has or can provide safe authentication, such as OAuth, a project token, or a scoped access token.
3. The MCP server exposes the data or operations needed for the task.
4. The task benefits from structured reads or writes more than from exported files.
5. The user approves installation or configuration.

## Do Not Recommend MCP When

- The user only needs a one-time read of a webpage.
- The webpage is password-protected but can be opened in Chrome.
- The docs can be exported to Markdown, HTML, OpenAPI, Postman, Apifox, PDF, CSV, or JSON.
- The task is still in planning-only mode.
- The MCP would require sensitive credentials that the user has not chosen to provide.
- The MCP would mutate production data or live cloud/payment resources.

## Apifox-Like API Docs

For shared API documentation:

- First try a browser or Chrome session if the docs require a password or login state.
- Prefer exported Markdown, OpenAPI, Postman Collection, or Apifox export files for stable analysis.
- Consider Apifox MCP only for long-running work where the user has project-level access, a project ID, and an access token.
- Do not treat a public share URL with a password as proof that MCP can read the project.

## Output Requirements

When making an MCP recommendation, state:

- Why local files/browser/exported docs are insufficient.
- Which MCP server is needed.
- What credentials or identifiers are required.
- Whether the MCP is read-only or can mutate external state.
- What the fallback path is if the MCP is not installed.
