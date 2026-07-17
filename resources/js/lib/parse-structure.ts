import type { Molecule } from 'openchemlib';
import type * as OCLModule from 'openchemlib';

function fromMolfile(OCL: typeof OCLModule, value: string): Molecule | null {
    try {
        const molecule = OCL.Molecule.fromMolfile(value);

        return molecule.getAllAtoms() > 0 ? molecule : null;
    } catch {
        return null;
    }
}

/**
 * Parse a stored structure string. New sketches are saved as molfiles
 * (lossless, keeps the drawn layout); older rows hold SMILES.
 * Returns null when the value cannot be parsed.
 */
export function parseStructure(
    OCL: typeof OCLModule,
    value: string,
): Molecule | null {
    if (!value.includes('\n')) {
        try {
            return OCL.Molecule.fromSmiles(value);
        } catch {
            return null;
        }
    }

    // Laravel's TrimStrings middleware strips a molfile's leading blank
    // title line, shifting every line; re-adding it repairs such rows.
    return fromMolfile(OCL, value) ?? fromMolfile(OCL, '\n'.concat(value));
}

/**
 * Make a molfile survive whitespace trimming in transit: give it a
 * non-empty title line so nothing meaningful starts or ends the string.
 */
export function trimSafeMolfile(molfile: string): string {
    return molfile.startsWith('\n') ? 'ChemTag'.concat(molfile) : molfile;
}
