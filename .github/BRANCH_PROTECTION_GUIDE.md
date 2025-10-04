# GitHub Repository Ruleset Configuration

This document explains how to configure GitHub repository rulesets to ensure:
1. Feature branches must be created (no direct commits to `main`)
2. Only @thetallbloke can approve PRs
3. Others can create PRs, but approval is required from @thetallbloke

## CODEOWNERS File

The `.github/CODEOWNERS` file has been created to specify that @thetallbloke is required to review all changes. This ensures that all PRs require approval from @thetallbloke.

## Branch Protection Rules Configuration

To complete the setup, you need to configure branch protection rules through GitHub's web interface:

### Step 1: Access Branch Protection Settings

1. Go to your repository on GitHub: `https://github.com/thetallbloke/n8n`
2. Click on **Settings** (top menu)
3. Click on **Branches** (left sidebar under "Code and automation")

### Step 2: Configure Branch Protection Rule for `main`

Click "Add branch protection rule" or "Add rule" and configure:

#### Branch name pattern
- Enter: `main`

#### Protect matching branches - Enable these settings:

✅ **Require a pull request before merging**
   - ✅ Require approvals: **1**
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require review from Code Owners (this ensures @thetallbloke must approve)
   - ⬜ Restrict who can dismiss pull request reviews (optional)
   - ⬜ Allow specified actors to bypass required pull requests (leave empty)

✅ **Require status checks to pass before merging**
   - ⬜ Require branches to be up to date before merging (optional)

✅ **Require conversation resolution before merging** (optional but recommended)

✅ **Require linear history** (optional - prevents merge commits)

✅ **Do not allow bypassing the above settings**
   - This ensures even admins (including you) must follow the rules

⬜ **Restrict who can push to matching branches** (optional)
   - If you want to be extra strict, you can restrict pushes

✅ **Allow force pushes** - Set to: **Specify who can force push**
   - Leave empty (no one can force push)

✅ **Allow deletions** - **Disabled** (prevents branch deletion)

### Step 3: Alternative - Use Rulesets (New GitHub Feature)

GitHub now offers "Rulesets" as a more modern alternative. To use rulesets:

1. Go to **Settings** → **Rules** → **Rulesets**
2. Click "New ruleset" → "New branch ruleset"
3. Configure the ruleset:
   - **Ruleset Name**: `Protect main branch`
   - **Enforcement status**: Active
   - **Bypass list**: Empty (no one can bypass)
   - **Target branches**: Include default branch (`main`)

4. Enable these rules:
   - ✅ **Restrict deletions**
   - ✅ **Require a pull request before merging**
     - Required approvals: **1**
     - Require review from Code Owners
     - Dismiss stale pull request approvals when new commits are pushed
   - ✅ **Require status checks to pass** (if you have CI/CD)
   - ✅ **Block force pushes**

### Step 4: Verify Configuration

To test that your setup works correctly:

1. Try to push directly to `main` - this should be blocked
2. Create a feature branch: `git checkout -b feature/test`
3. Make a change and push: `git push origin feature/test`
4. Create a PR from the feature branch to `main`
5. Verify that:
   - The PR shows that review is required from @thetallbloke
   - The PR cannot be merged without approval from @thetallbloke
   - Others can create PRs but cannot approve them

## Workflow for Contributors

Contributors should follow this workflow:

1. **Fork the repository** (external contributors) or **clone the repository** (collaborators)
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make changes and commit**:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```
4. **Push to the feature branch**:
   ```bash
   git push origin feature/your-feature-name
   ```
5. **Create a Pull Request** on GitHub from your feature branch to `main`
6. **Wait for @thetallbloke to review and approve** the PR
7. **Merge the PR** once approved (either you or @thetallbloke can merge after approval)

## Summary

With this configuration:
- ✅ No one can push directly to `main` (including you)
- ✅ All changes must go through pull requests
- ✅ All PRs require approval from @thetallbloke (enforced by CODEOWNERS)
- ✅ Anyone can create PRs, but only @thetallbloke can approve them
- ✅ The branch protection rules ensure the workflow is enforced

## Note on Repository Permissions

For the CODEOWNERS file to work effectively:
- Contributors need at least **Read** access to create PRs (for forks, this is automatic)
- Contributors with **Write** access can create branches and PRs
- @thetallbloke needs **Admin** or **Maintain** access to approve PRs and manage settings

## Additional Resources

- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
- [CODEOWNERS File](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
