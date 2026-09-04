# FactLedger — Market Readiness Scorecard

This file is the evidence-based operating scorecard for launch, financing and strategic-readiness decisions. Check an item only when there is verifiable evidence.

## Product proof
- [ ] Public dashboard production URL returns HTTP 200.
- [ ] Public API health endpoint independently verified.
- [ ] Dashboard → API authenticated round trip verified.
- [ ] Solana mainnet RPC request verified in production.
- [ ] WebSocket/reconnect path verified.
- [ ] ChainGPT real-key request verified, or explicitly reported as unverified while fallback remains functional.
- [ ] End-to-end demo script completed without manual data fabrication.

## Trust & diligence
- [x] Automated test suite established.
- [x] Type-check/build verification established.
- [x] Architecture documentation exists.
- [x] Launch checklist exists.
- [ ] Current production dependency/security findings reviewed and classified.
- [ ] Production secret-management configuration verified without recording secret values.
- [ ] Data retention/provenance policy documented before proprietary intelligence history is commercialized.
- [ ] Terms/privacy/commercial legal documents reviewed by qualified counsel before paid public launch where required.

## Distribution
- [ ] 5 design partners contacted.
- [ ] 3 design partners actively testing.
- [ ] First external API integration live.
- [ ] First external MCP/agent integration live.
- [ ] Recurring product feedback process established.

## Commercial proof
- [ ] Pricing interviews completed.
- [ ] Paid API packaging validated.
- [ ] First paying organization.
- [ ] MRR tracked from source-of-truth billing data.
- [ ] Retention/usage cohort tracked.

## Funding readiness
- [ ] Public demo URL.
- [ ] Demo video.
- [ ] One-page brief.
- [ ] Pitch deck.
- [ ] Milestone/use-of-funds model.
- [ ] Verified traction metrics.
- [ ] Current official grant/accelerator terms reviewed before each submission.
- [ ] Submission evidence retained for each application.

## Acquisition readiness
- [ ] IP ownership chain documented.
- [ ] Material third-party licenses inventoried.
- [ ] Customer/pilot agreements organized.
- [ ] Financial model and operating costs organized.
- [ ] Security/dependency register current.
- [ ] Technical diligence package current.
- [ ] Buyer longlist segmented by strategic rationale.
- [ ] Acquisition teaser contains no confidential information or unsupported claims.

## Current blocker

Production dashboard deployment cannot be considered verified until the Vercel deployment workflow passes. The workflow requires the repository `VERCEL_TOKEN` secret; secret values must never be committed or pasted into documentation.

## Next action after the blocker clears

Run the deployment workflow, capture the production URL, execute the smoke test, verify Dashboard → API authentication/CORS, then immediately prepare the public demo and begin design-partner + funding outreach in parallel.
