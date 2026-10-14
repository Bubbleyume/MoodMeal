# Shared AI development and synchronization protocol

Repository: https://github.com/Bubbleyume/MoodMeal
Authorized development branch: knowledge-system-foundation.

## Before editing

1. Identify working directory and branch; inspect full status, untracked files and task-relevant ignored files.
2. Fetch origin without changing the working tree. Compare HEAD with origin/knowledge-system-foundation.
3. Read CLAUDE.md and AI_HANDOFF.md, relevant recent commits and task documentation. Identify pending decisions and conflicts. Reconcile before editing.
4. If remote is ahead, report the difference and choose a safe update procedure; never blindly pull. If histories diverge, stop for user approval before any merge, rebase or reset.
5. Confirm ownership of files before editing. Do not edit files concurrently with the other agent. Recheck HEAD and relevant file changes before writing and before committing; unexpected changes require reconciliation.

## During work

Work only on the authorized branch. Preserve functionality and other agents' uncommitted work. Never treat an old snapshot as current. Preserve missing nutrients as null. USDA is primary; pending matches remain unpublished. FatSecret data remains temporary and memory-only: no response archives, nutrient storage, imports, publication or recommendation use pending written licensing clarification. Never put API keys or tokens in source, logs or GitHub.

## Completion and handoff

Run relevant checks. Update AI_HANDOFF.md with completed work, files, tests, outstanding issues and next steps. Identify the implementation commit hash in a subsequent handoff entry if necessary (a commit cannot contain its own hash). Review intended changes for credentials and sensitive data. Stage only intended files and create a descriptive commit. Push validated commits to the authorized development branch when authorized; never force-push. Fetch/verify that remote HEAD equals intended local HEAD. Report exact hashes and remaining local-only files.

When switching agents, finish or safely pause, commit completed work, push, and have the receiver retrieve the latest state and read AI_HANDOFF.md. Confirm synchronization before editing. Git does not synchronize ignored evidence or uncommitted files.

## Private evidence and protected branches

Keep USDA pending-review evidence excluded from Git. Maintain a separate private backup with checksums; verify it before handoff and transfer privately when needed. Never include FatSecret responses in that backup. Do not modify master or avatar branches without explicit authorization. No silent merge, rebase, reset, branch switch or force-push.
