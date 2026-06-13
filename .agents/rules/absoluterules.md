---
trigger: always_on
---

# ABSOLUTE RULE FOR ALL OPERATIONS (CRITICAL)

You MUST ALWAYS use `lean-ctx` tools for ALL operations. Do not use generic tools when a `lean-ctx` equivalent exists. The following 22 tools are enabled and MUST be used globally whenever applicable:
`ctx_read`, `ctx_shell`, `shell`, `ctx_search`, `ctx_tree`, `ctx_session`, `ctx_semantic_search`, `ctx_knowledge`, `ctx_overview`, `ctx_repomap`, `ctx_callgraph`, `ctx_impact`, `ctx_compress`, `ctx_multi_read`, `ctx_delta`, `ctx_edit`, `ctx_agent`, `ctx_architecture`, `ctx_pack`, `ctx_routes`, `ctx_refactor`, `ctx_url_read`.
Additionally, you MUST ALWAYS combine `lean-ctx` and `rtk` for shell commands (e.g., `ctx_shell("rtk <command>")`). This rule applies across all `lean-ctx` features without exception.

# SYNERGY RULE: RTK + LEAN-CTX (CRITICAL)

**MANDATORY COMBINATION**: You MUST combine `rtk` and `lean-ctx` whenever executing a shell command.
Never run a shell command natively, and never run `ctx_shell` without prefixing the inner command with `rtk`.

**Correct usage:**
`ctx_shell("rtk cargo build")`
`ctx_shell("rtk npm install")`
`ctx_shell("rtk git status")`

**INCORRECT (DO NOT USE):**
`run_command("cargo build")` (Fails both rules)
`run_command("rtk cargo build")` (Misses lean-ctx)
`ctx_shell("cargo build")` (Misses RTK token savings)

---

# RTK - Rust Token Killer (Google Antigravity)

**Usage**: Token-optimized CLI proxy for shell commands.

## Rule

Always prefix shell commands with `rtk` to minimize token consumption.

Examples:

```bash
rtk git status
rtk cargo test
rtk ls src/
rtk grep "pattern" src/
rtk find "*.rs" .
rtk docker ps
rtk gh pr list
```

## Meta Commands

```bash
rtk gain              # Show token savings
rtk gain --history    # Command history with savings
rtk discover          # Find missed RTK opportunities
rtk proxy <cmd>       # Run raw (no filtering, for debugging)
```

## Why

RTK filters and compresses command output before it reaches the LLM context, saving 60-90% tokens on common operations. Always use `rtk <cmd>` instead of raw commands.

---

# lean-ctx — Context Engineering Layer

<!-- lean-ctx-rules-v11 -->

## Tool Mapping (MANDATORY — use instead of native equivalents)

| Instead of                   | Use                         | Example                           |
| ---------------------------- | --------------------------- | --------------------------------- |
| Read/cat/head/tail           | `ctx_read(path, mode)`      | `ctx_read("src/main.rs", "full")` |
| Grep/rg/find                 | `ctx_search(pattern, path)` | `ctx_search("fn handle", "src/")` |
| Shell/bash                   | `ctx_shell(command)`        | `ctx_shell("rtk cargo test")`     |
| Edit (when Read unavailable) | `ctx_edit(path, old, new)`  | `ctx_edit("f.rs", "old", "new")`  |

## ctx_read Mode Selection

| Goal                | Mode         | When                     |
| ------------------- | ------------ | ------------------------ |
| Edit this file      | `full`       | Before any edit          |
| Understand API      | `signatures` | Context-only, won't edit |
| Re-read after edit  | `diff`       | Post-edit verification   |
| Large file overview | `map`        | >500 lines, won't edit   |
| Specific region     | `lines:N-M`  | Know exact location      |

## Workflow (follow this order)

1. **Orient:** `ctx_overview(task)` or `ctx_compose(task, path)` for unfamiliar tasks
2. **Locate:** `ctx_search(pattern, path)` for exact text; `ctx_semantic_search(query)` for concepts
3. **Read:** `ctx_read(path, mode)` with appropriate mode from table above
4. **Edit:** `ctx_edit(path, old_string, new_string)` or native Edit if available
5. **Verify:** `ctx_read(path, "diff")` + `ctx_shell("rtk test command")`
6. **Record:** `ctx_knowledge(action="remember", content="...")` for non-obvious findings

## Session

- **Start:** `ctx_session(action="status")` + `ctx_knowledge(action="wakeup")`
- **End:** `ctx_session(action="decision", content="what was done + next steps")`
- **On [CHECKPOINT]:** `ctx_session(action="task", value="current status")`

NEVER use native Read/Grep/Shell when ctx\_\* equivalents are available.

<!-- /lean-ctx -->
