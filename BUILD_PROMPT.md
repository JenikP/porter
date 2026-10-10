IMPORTANT OUTPUT RULE:

Do not rely on terminal chat output for progress reporting.

After EVERY task, you MUST write a complete report file to:

docs/progress/TASK-XX-report.md

The report must contain:

- task name
- status: PASS / PARTIAL / FAIL
- what was built
- files created
- files modified
- commands run
- tests run
- test results
- assumptions made
- unresolved issues
- next task

You must continue automatically after writing each report.

Also maintain:

docs/progress/BUILD-STATUS.md

Update this file after every task with a table:

Task | Status | Summary | Report File

The files on disk are the authoritative progress output.
Do not depend on the terminal UI to display your explanations.
