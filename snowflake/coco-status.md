# CoCo CLI execution status

CoCo CLI was installed and a Snowflake-authenticated read-only SQL/code review was attempted on 3 October 2026.

Installed executable reported: Cortex Code v0.26.1003.

Server response: `Cortex Code is not enabled or the usage limit has been reached. Please upgrade your account to continue using Cortex Code.`

This is an account eligibility blocker, not evidence that CoCo generated or validated the project. No successful CoCo-assisted build is claimed.

Snowflake documentation states that standard trial accounts cannot use CoCo CLI; a paid account or dedicated CoCo CLI trial is required: https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code-cli

Run with an eligible connection before submitting a claim of CoCo use:

```powershell
cortex -c ELIGIBLE_CONNECTION --sql-read-only --max-turns 5 --allowed-tools Read -p "Review snowflake/bootstrap.sql and lib/risk.ts. Validate FRAUD_SIGNALS with read-only SQL. Report errors." --output-last-message snowflake/coco-review.txt
```
