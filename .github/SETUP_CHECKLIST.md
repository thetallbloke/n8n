# Quick Setup Checklist for GitHub Branch Protection

Use this checklist when configuring branch protection rules in GitHub's web interface.

## ✅ Configuration Checklist

### Access Settings
- [ ] Go to https://github.com/thetallbloke/n8n/settings
- [ ] Click "Branches" in the left sidebar

### Configure Branch Protection Rule
- [ ] Click "Add branch protection rule" or "Add rule"
- [ ] Enter `main` as the branch name pattern

### Required Settings (Check ALL of these)
- [ ] ✅ **Require a pull request before merging**
  - [ ] Set "Required approvals" to: **1**
  - [ ] ✅ **Require review from Code Owners**
  - [ ] ✅ **Dismiss stale pull request approvals when new commits are pushed**

- [ ] ✅ **Do not allow bypassing the above settings**
  - This ensures even admins must follow the rules

- [ ] ✅ **Restrict who can push to matching branches** (Recommended)
  - [ ] Leave the allowed actors list empty OR add only trusted collaborators
  - This prevents direct pushes to main

- [ ] ✅ **Allow force pushes** → Set to: **Specify who can force push**
  - [ ] Leave the list empty (no one can force push)

- [ ] ✅ **Allow deletions** → **Disabled**

### Optional but Recommended Settings
- [ ] ✅ **Require conversation resolution before merging**
- [ ] ✅ **Require linear history** (prevents merge commits, cleaner history)
- [ ] ✅ **Require status checks to pass before merging** (if you add CI/CD later)

### Save Configuration
- [ ] Scroll to bottom and click **"Create"** or **"Save changes"**

## 🧪 Testing the Configuration

After saving, test that it works:

### Test 1: Direct Push to Main (Should Fail)
```bash
# This should be blocked
git checkout main
echo "test" >> test.txt
git add test.txt
git commit -m "test direct push"
git push origin main
# Expected: ❌ Push rejected by GitHub
```

### Test 2: Feature Branch Workflow (Should Work)
```bash
# Create feature branch
git checkout -b feature/test-branch
echo "test" >> test.txt
git add test.txt
git commit -m "test feature branch"
git push origin feature/test-branch
# Expected: ✅ Push succeeds
```

### Test 3: PR Creation and Approval
- [ ] Create a PR from feature branch to main
- [ ] Verify PR shows "Review required from @thetallbloke" or similar message
- [ ] Verify the merge button is disabled until @thetallbloke approves
- [ ] Have @thetallbloke approve the PR
- [ ] Verify merge button becomes enabled after approval

## ✅ Success Indicators

Your configuration is correct when:
1. ✅ Cannot push directly to `main` branch
2. ✅ Can create and push feature branches
3. ✅ PRs require @thetallbloke's approval before merging
4. ✅ CODEOWNERS file shows @thetallbloke as required reviewer
5. ✅ Pull request template appears when creating new PRs

## 🔍 Troubleshooting

### Issue: Can still push to main
- Check that "Restrict who can push to matching branches" is enabled
- Verify no one is in the bypass list
- Ensure "Do not allow bypassing the above settings" is checked

### Issue: PRs don't require @thetallbloke's approval
- Verify CODEOWNERS file is in `.github/CODEOWNERS`
- Check that "Require review from Code Owners" is enabled
- Ensure the branch protection rule is saved and active

### Issue: Can't find CODEOWNERS settings
- The CODEOWNERS file must be in one of these locations:
  - `.github/CODEOWNERS` (✅ correct location)
  - `CODEOWNERS` (root of repository)
  - `docs/CODEOWNERS`

## 📚 Resources

- [Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [CODEOWNERS Documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [Full Configuration Guide](.github/BRANCH_PROTECTION_GUIDE.md)
