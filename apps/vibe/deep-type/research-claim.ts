// Single injection point for every research number that reaches a screen. Hardcoding any of these in copy is
// banned: the counts are a snapshot of a private corpus that will be re-run, and a literal left in a component
// becomes an unverifiable claim the moment the snapshot moves.
//
// Provenance — the DeepType transfer package, whose file hashes are pinned by `manifestSha256` below:
//   research/11_reviewed_source_registry.json    (registry: totals + reviewDepthCounts)
//   research/12_research_screening_audit.json    (audit: raw candidate reconciliation)
//   research/13_item_result_evidence_matrix.json (matrix: item/result linkage)
// The raw 18MB corpus lives in the private `sobok/deeptype-research` repo under a `registry-v11-YYYYMMDD` tag.
//
// To update: replace the snapshot, re-run tools/verify-research-claim.mjs, and reconcile every reported diff.
// Do not edit a field here without re-running that script — the numbers are load-bearing for the R1/R2 copy.
export const RESEARCH_CLAIM = {
  // matrix.directReviewedSourceCount — sources cited directly by an item or a result block.
  appliedToItems: 20,
  // registry.reviewDepthCounts.citation_application_screened — middle review depth.
  citationApplicationScreened: 246,
  // registry.reviewDepthCounts.documented_core_review — deepest tier, NOT a subset of `screenedSources`.
  documentedCoreReview: 141,
  // sha256 of FILE_MANIFEST_SHA256.txt itself. Pinning the manifest pins all 431 packaged files transitively,
  // so one comparison proves the whole snapshot is the one these numbers were read from.
  manifestSha256: '2471e84657d5390c4bce4763160f349e25be6b0a528a3d4110277a20821ade34',
  // registry.publicSourceFloor — the deliberately rounded-down figure quoted in copy ("1,000편 이상").
  // It floors `screenedSources`, the shallowest tier, which is why R2 must sit in the same block as R1.
  publicFloor: 1000,
  // audit.rawUniqueCandidates — pre-screening pool. Never quoted to users; kept for the funnel audit trail.
  rawCandidates: 4086,
  // False until the full source list is published. R7 withholds it because the list exposes item design, so any
  // UI that would enumerate sources must stay gated on this flag rather than on a reviewer's memory.
  registryPublic: false,
  // registry.exactRegistrySources — total registry size. Equals the three review-depth counts summed, which is
  // the only evidence that those tiers are mutually exclusive; assert it rather than trusting the shape.
  registrySources: 1559,
  // registry.reviewDepthCounts.title_abstract_screened — shallowest tier. `methodology` says title+abstract
  // relevance rules only, so copy says '선별해 확인' and never '검토'.
  screenedSources: 1172,
  // registry.generatedAt (audit.generatedAt is byte-identical — same run). The matrix was derived four minutes
  // later at 2026-07-25T23:00:26.907Z; the earlier stamp is canonical because the totals come from the registry.
  snapshotDate: '2026-07-25T22:56:04.558Z',
  // matrix.supportingMethodSourceCount — methodology support, disjoint from `appliedToItems` (20 + 6 = 26).
  supportingMethod: 6,
  // The corpus documents item design only. Nothing here validates DeepType's own reliability, validity, or
  // norms, so this stays false and gates any wording that would imply a validated instrument.
  validatedAssessmentClaim: false,
} as const
