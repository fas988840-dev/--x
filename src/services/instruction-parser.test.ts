import { describe, it, expect, beforeEach } from 'vitest';
import { InstructionParser } from '../services/instruction-parser';
import { DexRegistry } from '../services/dex-registry';
import { Instruction, validateProgramId } from '../types/domain';

describe('InstructionParser', () => {
  let registry: DexRegistry;
  let parser: InstructionParser;

  beforeEach(() => {
    registry = new DexRegistry();
    parser = new InstructionParser(registry);
  });

  describe('Unknown Program', () => {
    it('should return unknown status for unregistered program', () => {
      const unknownProgramId = validateProgramId('11111111111111111111111111111112'); // System program
      const instruction: Instruction = {
        programId: unknownProgramId,
        data: Buffer.from([0, 1, 2, 3]),
        accounts: [],
      };

      const parsed = parser.parseInstruction(instruction);

      expect(parsed.status).toBe('unknown');
      expect(parsed.programName).toBe('Unknown');
      expect(parsed.decoded).toBeNull();
    });
  });

  describe('Instruction Account Index Resolution', () => {
    it('should correctly handle instruction accounts array', () => {
      const unknownProgramId = validateProgramId('11111111111111111111111111111112');
      const instruction: Instruction = {
        programId: unknownProgramId,
        data: Buffer.from([0, 1, 2, 3]),
        accounts: [
          { pubkey: 'EPjFWaLb3odccccfFFd82hhSSUmUjKP6MtoxQTxxuQ', isSigner: true, isWritable: true },
          { pubkey: 'So11111111111111111111111111111111111111112', isSigner: false, isWritable: false },
        ],
      };

      const parsed = parser.parseInstruction(instruction);

      expect(parsed.raw.accounts.length).toBe(2);
      expect(parsed.raw.accounts[0].pubkey).toBe('EPjFWaLb3odccccfFFd82hhSSUmUjKP6MtoxQTxxuQ');
      expect(parsed.raw.accounts[0].isSigner).toBe(true);
      expect(parsed.raw.accounts[1].isSigner).toBe(false);
    });
  });

  describe('Swap Candidate Detection', () => {
    it('should identify swap candidate status', () => {
      const unknownProgramId = validateProgramId('11111111111111111111111111111112');
      const instruction: Instruction = {
        programId: unknownProgramId,
        data: Buffer.from([0, 1, 2, 3]),
        accounts: [],
      };

      const parsed = parser.parseInstruction(instruction);

      // Unknown status should not be a swap candidate or confirmed
      expect(parser.isSwapCandidate(parsed)).toBe(false);
      expect(parser.isConfirmedSwap(parsed)).toBe(false);
    });
  });

  describe('Multiple Instructions', () => {
    it('should parse multiple instructions', () => {
      const programId = validateProgramId('11111111111111111111111111111112');
      const instructions: Instruction[] = [
        {
          programId,
          data: Buffer.from([0]),
          accounts: [],
        },
        {
          programId,
          data: Buffer.from([1]),
          accounts: [],
        },
      ];

      const parsed = parser.parseInstructions(instructions);

      expect(parsed.length).toBe(2);
      expect(parsed[0].status).toBe('unknown');
      expect(parsed[1].status).toBe('unknown');
    });
  });
});
