---
allowed-tools: Zsh(git add:*), Zsh(git status:*), Zsh(git commit:*)
description: Create a git commit
---


## Context

- Current git status: "!`git status`"
- Current git diff (staged and unstaged changes): "!`git diff HEAD`"
- Current branch: "!`git branch --show-current`"
- Recent commits: "!`git log --oneline -10`"

## Generate Git Commit Message
Analyze the current git changes and create a conventional commit message that follows best practices.

## Process

1. **Analyze Repository State**
   - Run `git status` to see staged/unstaged changes
   - Run `git diff --staged` to examine staged changes in detail
   - Run `git diff` to see unstaged changes if needed

2. **Determine Commit Type**
   Based on the changes, select the appropriate conventional commit type:
   - `feat:` - New features or functionality
   - `fix:` - Bug fixes and corrections
   - `docs:` - Documentation only changes
   - `style:` - Code style changes (formatting, whitespace, semicolons)
   - `refactor:` - Code changes that neither fix bugs nor add features
   - `perf:` - Performance improvements
   - `test:` - Adding or modifying tests
   - `chore:` - Maintenance tasks, build changes, dependency updates
   - `ci:` - Continuous integration changes
   - `build:` - Build system or external dependency changes

3. **Identify Scope (Optional)**
   - Determine if changes are focused on a specific component, module, or area
   - Use parentheses format: `type(scope):`
   - Examples: `feat(auth):`, `fix(api):`, `docs(readme):`

4. **Craft Description**
   - Write a concise, imperative mood description (50 chars or less)
   - Start with lowercase letter
   - No period at the end
   - Example: "add user authentication middleware"

5. **Add Body (If Needed)**
   - Include if the commit needs more explanation
   - Wrap at 72 characters
   - Explain what and why, not how

6. **Check for Breaking Changes**
   - If changes break backward compatibility, add `BREAKING CHANGE:` footer
   - Or add `!` after type/scope: `feat!:` or `feat(api)!:`

7. **Generate Options**
   - Provide 2-3 commit message options
   - Explain the reasoning for the primary recommendation
   - Show the complete commit command to execute

## Example Output Format

```
Based on the git diff analysis, here are commit message options:

**Recommended:**
```
feat(auth): add JWT token validation middleware

- Implement token verification for protected routes  
- Add error handling for expired tokens
- Include unit tests for auth middleware
```

**Alternative:**
```
feat: implement authentication middleware for API routes
```

**Command to execute:**
git commit -m "feat(auth): add JWT token validation middleware" -m "- Implement token verification for protected routes" -m "- Add error handling for expired tokens" -m "- Include unit tests for auth middleware"
```

## Notes

- Follow conventional commits specification (v1.0.0)
- Ensure commit message is descriptive but concise
- Stage changes with `git add` if needed before committing
- Consider squashing multiple small commits if they represent a single logical change
- **DO NOT** add co-author attribution to commit messages