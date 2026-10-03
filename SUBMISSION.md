# Aegis — Risk, Fraud & Regulatory Intelligence Copilot

Challenge: Risk, Fraud and Regulatory Intelligence Copilot

Public repository: https://github.com/anshuman542018/aegis-risk-copilot

Deployed app: https://aegis-risk-copilot.vercel.app

## Description
Aegis connects suspicious transaction patterns, account context and policy clauses in an evidence-backed investigation workspace. A real Snowflake warehouse holds synthetic account, payment and loan data; typed SQL views and secure fraud signals prioritize cases. Analysts can inspect circular transfers, shared devices, payment velocity, possible structuring and KYC review signals, ask bounded natural-language questions, explore credit and liquidity stress scenarios, and export a finding draft with transaction evidence, policy references, the Snowflake query ID and a SHA-256 digest. Decisions remain subject to human review.

## Judge demo (three minutes)
1. Open the app. Confirm the Snowflake live badge and five prioritized accounts.
2. Investigate ACC-001. Inspect its cycle ACC-001 → ACC-002 → ACC-003 → ACC-001 and transaction IDs TX-0241–TX-0243.
3. Open a linked policy, add an analyst note and export the finding draft.
4. Ask “LCR under 20% outflow stress”. Inspect the 83.3% LCR and INR 30 lakh shortfall.
5. Open Portfolio risk and adjust credit PD and liquidity stress assumptions.
6. Open Data & architecture to download the SQL, full source, dataset and presentation.

## Files
- Editable deck: `/Aegis-presentation.pptx`
- Browser deck: `/presentation.html`
- Full source: `/aegis-source.zip`
- Synthetic dataset: `/demo-data.json` (CC0)
- Application source: MIT

## Honest account limitations
The existing Snowflake standard trial successfully runs the data warehouse and SQL API. It refuses CoCo CLI access. A headless CLI attempt and the refusal are documented in `snowflake/coco-status.md`; successful CoCo CLI use is not claimed. Snowflake Cortex COMPLETE also returns “AI function COMPLETE is not available for trial accounts.” Natural-language answers therefore use bounded, evidence-backed calculations. Optional Cortex integration is implemented for an eligible account and disabled on this deployment.

## Manual portal submission
The GitHub/Deployed Link form requires the challenge selection, public GitHub repository URL and deployed URL. The Prototype/MVP form carries the remaining presentation fields. A human must perform the final portal entry and Submit action: section 12 of the competition rules prohibits automated entry methods. Do not attest to successful CoCo use or full eligibility while that account limitation remains.

Official-template PDF: /Aegis-submission.pdf (6 pages, below 5 MB). Confirm team name and registered team size on the cover before final upload. Demo video is a mandatory 3–5 minute recording showing Input → Processing → Output via CoCo CLI. The present account cannot satisfy that requirement. Do not substitute a static walkthrough or claim a CoCo workflow was executed.

