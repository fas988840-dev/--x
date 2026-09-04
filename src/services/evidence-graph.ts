import { createHash } from 'node:crypto';

export type EvidenceEntityType =
  | 'wallet'
  | 'transaction'
  | 'token'
  | 'program'
  | 'counterparty'
  | 'evidence'
  | 'risk_event';

export type EvidenceConfidence = 'confirmed' | 'candidate' | 'unknown';

export interface EvidenceEntityRef {
  type: EvidenceEntityType;
  id: string;
}

export interface EvidenceSource {
  kind: 'solana_rpc' | 'derived' | 'registry' | 'external';
  reference?: string;
}

export interface EvidenceObservationInput {
  entity: EvidenceEntityRef;
  related?: EvidenceEntityRef[];
  observedAt: number;
  source: EvidenceSource;
  claim: string;
  confidence: EvidenceConfidence;
  rulesetVersion: string;
  expiresAt?: number;
  riskScore?: number;
  metadata?: Record<string, unknown>;
}

export interface EvidenceObservation extends EvidenceObservationInput {
  id: string;
  related: EvidenceEntityRef[];
  metadata: Record<string, unknown>;
}

export interface EvidenceGraphStats {
  observations: number;
  uniqueEntities: number;
  confirmed: number;
  candidate: number;
  unknown: number;
}

/**
 * Storage contract for FactLedger's Evidence/Risk Graph.
 *
 * The first implementation is intentionally in-memory and append-only. It is
 * safe for deterministic analysis/tests, but is NOT durable across process
 * restarts. A production database adapter can implement the same interface
 * without changing callers.
 */
export interface EvidenceGraphStore {
  append(input: EvidenceObservationInput): EvidenceObservation;
  get(id: string): EvidenceObservation | undefined;
  findByEntity(entity: EvidenceEntityRef): EvidenceObservation[];
  getRiskTimeline(entity: EvidenceEntityRef): EvidenceObservation[];
  stats(): EvidenceGraphStats;
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, canonicalize(record[key])])
    );
  }
  return value;
}

function observationId(input: EvidenceObservationInput): string {
  const payload = canonicalize({
    entity: input.entity,
    related: input.related ?? [],
    observedAt: input.observedAt,
    source: input.source,
    claim: input.claim,
    confidence: input.confidence,
    rulesetVersion: input.rulesetVersion,
    expiresAt: input.expiresAt ?? null,
    riskScore: input.riskScore ?? null,
    metadata: input.metadata ?? {},
  });

  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function entityKey(entity: EvidenceEntityRef): string {
  return `${entity.type}:${entity.id}`;
}

function validateInput(input: EvidenceObservationInput): void {
  if (!input.entity.id.trim()) throw new Error('Evidence entity id is required');
  if (!input.claim.trim()) throw new Error('Evidence claim is required');
  if (!input.rulesetVersion.trim()) throw new Error('rulesetVersion is required');
  if (!Number.isFinite(input.observedAt) || input.observedAt < 0) {
    throw new Error('observedAt must be a non-negative finite timestamp');
  }
  if (input.expiresAt !== undefined && input.expiresAt < input.observedAt) {
    throw new Error('expiresAt cannot be before observedAt');
  }
  if (
    input.riskScore !== undefined &&
    (!Number.isFinite(input.riskScore) || input.riskScore < 0 || input.riskScore > 100)
  ) {
    throw new Error('riskScore must be between 0 and 100');
  }
}

function copyObservation(observation: EvidenceObservation): EvidenceObservation {
  return {
    ...observation,
    entity: { ...observation.entity },
    source: { ...observation.source },
    related: observation.related.map((entity) => ({ ...entity })),
    metadata: { ...observation.metadata },
  };
}

export class InMemoryEvidenceGraphStore implements EvidenceGraphStore {
  private readonly observations = new Map<string, EvidenceObservation>();
  private readonly entityIndex = new Map<string, Set<string>>();

  append(input: EvidenceObservationInput): EvidenceObservation {
    validateInput(input);
    const id = observationId(input);
    const existing = this.observations.get(id);
    if (existing) return copyObservation(existing);

    const observation: EvidenceObservation = {
      ...input,
      id,
      entity: { ...input.entity },
      source: { ...input.source },
      related: (input.related ?? []).map((entity) => ({ ...entity })),
      metadata: { ...(input.metadata ?? {}) },
    };

    this.observations.set(id, observation);
    this.index(entityKey(observation.entity), id);
    for (const related of observation.related) this.index(entityKey(related), id);

    return copyObservation(observation);
  }

  get(id: string): EvidenceObservation | undefined {
    const observation = this.observations.get(id);
    return observation ? copyObservation(observation) : undefined;
  }

  findByEntity(entity: EvidenceEntityRef): EvidenceObservation[] {
    const ids = this.entityIndex.get(entityKey(entity));
    if (!ids) return [];

    return [...ids]
      .map((id) => this.observations.get(id))
      .filter((item): item is EvidenceObservation => item !== undefined)
      .sort((a, b) => a.observedAt - b.observedAt || a.id.localeCompare(b.id))
      .map(copyObservation);
  }

  getRiskTimeline(entity: EvidenceEntityRef): EvidenceObservation[] {
    return this.findByEntity(entity).filter(
      (observation) => observation.entity.type === 'risk_event' || observation.riskScore !== undefined
    );
  }

  stats(): EvidenceGraphStats {
    let confirmed = 0;
    let candidate = 0;
    let unknown = 0;
    const entities = new Set<string>();

    for (const observation of this.observations.values()) {
      entities.add(entityKey(observation.entity));
      for (const related of observation.related) entities.add(entityKey(related));
      if (observation.confidence === 'confirmed') confirmed += 1;
      else if (observation.confidence === 'candidate') candidate += 1;
      else unknown += 1;
    }

    return {
      observations: this.observations.size,
      uniqueEntities: entities.size,
      confirmed,
      candidate,
      unknown,
    };
  }

  private index(key: string, id: string): void {
    const ids = this.entityIndex.get(key) ?? new Set<string>();
    ids.add(id);
    this.entityIndex.set(key, ids);
  }
}
