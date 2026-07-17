import { motion } from 'framer-motion';
import type * as OCLModule from 'openchemlib';
import { Fragment,  useEffect, useState } from 'react';
import type {ReactNode} from 'react';
import { parseStructure } from '@/lib/parse-structure';

interface ClueTiles {
    structureSvg: string;
    hydrogenSvg: string | null;
    formula: string;
    molarMass: number;
    facts: string[];
}

const SVG_OPTIONS = {
    autoCrop: true,
    autoCropMargin: 14,
    suppressChiralText: true,
};

function buildTiles(OCL: typeof OCLModule, smiles: string): ClueTiles | null {
    const molecule = parseStructure(OCL, smiles);

    if (!molecule || molecule.getAllAtoms() === 0) {
        return null;
    }

    const structureSvg = molecule.toSVG(300, 300, undefined, SVG_OPTIONS);

    // Same molecule drawn with every hydrogen shown — a second "photo"
    // of the compound from a different angle.
    let hydrogenSvg: string | null = null;

    try {
        const explicit = parseStructure(OCL, smiles);

        if (explicit) {
            explicit.addImplicitHydrogens();
            explicit.inventCoordinates();
            hydrogenSvg = explicit.toSVG(300, 300, undefined, SVG_OPTIONS);
        }
    } catch {
        hydrogenSvg = null;
    }

    const molecularFormula = molecule.getMolecularFormula();

    molecule.ensureHelperArrays(OCL.Molecule.cHelperRings);

    let doubleBonds = 0;
    let tripleBonds = 0;
    let aromaticBonds = 0;

    for (let bond = 0; bond < molecule.getAllBonds(); bond++) {
        if (molecule.isAromaticBond(bond)) {
            aromaticBonds++;
        } else if (molecule.getBondOrder(bond) === 2) {
            doubleBonds++;
        } else if (molecule.getBondOrder(bond) === 3) {
            tripleBonds++;
        }
    }

    const rings = molecule.getRingSet().getSize();
    const facts = [
        rings > 0 ? `${rings} ring${rings > 1 ? 's' : ''}` : 'no rings',
        aromaticBonds > 0
            ? 'aromatic'
            : tripleBonds > 0
              ? `${tripleBonds} triple bond${tripleBonds > 1 ? 's' : ''}`
              : doubleBonds > 0
                ? `${doubleBonds} double bond${doubleBonds > 1 ? 's' : ''}`
                : 'single bonds only',
    ];

    return {
        structureSvg,
        hydrogenSvg,
        formula: molecularFormula.formula,
        molarMass: molecularFormula.relativeWeight,
        facts,
    };
}

/** "C5H12" → C₅H₁₂ */
function FormulaText({ formula }: { formula: string }) {
    return (
        <span>
            {formula
                .split(/(\d+)/)
                .map((part, i) =>
                    /^\d+$/.test(part) ? (
                        <sub key={i}>{part}</sub>
                    ) : (
                        <Fragment key={i}>{part}</Fragment>
                    ),
                )}
        </span>
    );
}

function Tile({
    index,
    label,
    children,
}: {
    index: number;
    label: string;
    children: ReactNode;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.08 }}
            className="relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-foreground/10 bg-white p-2"
        >
            <span className="absolute top-2 left-3 text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                {label}
            </span>
            {children}
        </motion.div>
    );
}

/**
 * Generated stand-in for the "4 Pics" grid: when a Clue Hunter question has
 * no uploaded photos but stores a structure, render four clue tiles from it
 * (skeletal drawing, hydrogen-explicit drawing, formula, quick facts).
 */
export function ClueTileGrid({ smiles }: { smiles: string }) {
    const [tiles, setTiles] = useState<ClueTiles | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;

        import('openchemlib')
            .then((OCL) => {
                if (cancelled) {
                    return;
                }

                const built = buildTiles(OCL, smiles);

                if (built) {
                    setTiles(built);
                } else {
                    setFailed(true);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setFailed(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [smiles]);

    if (failed) {
        return null;
    }

    if (!tiles) {
        return (
            <div className="mx-auto grid w-full max-w-sm grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="aspect-square w-full animate-pulse rounded-2xl border-2 border-foreground/10 bg-muted"
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="mx-auto grid w-full max-w-sm grid-cols-2 gap-2">
            <Tile index={0} label="Structure">
                <div
                    className="flex h-full w-full items-center justify-center pt-3 [&_svg]:h-auto [&_svg]:max-h-full [&_svg]:max-w-full"
                    dangerouslySetInnerHTML={{ __html: tiles.structureSvg }}
                />
            </Tile>

            <Tile index={1} label="All atoms">
                {tiles.hydrogenSvg ? (
                    <div
                        className="flex h-full w-full items-center justify-center pt-3 [&_svg]:h-auto [&_svg]:max-h-full [&_svg]:max-w-full"
                        dangerouslySetInnerHTML={{ __html: tiles.hydrogenSvg }}
                    />
                ) : (
                    <span className="text-2xl font-bold text-slate-700">
                        <FormulaText formula={tiles.formula} />
                    </span>
                )}
            </Tile>

            <Tile index={2} label="Formula">
                <span className="text-3xl font-bold text-slate-700">
                    <FormulaText formula={tiles.formula} />
                </span>
            </Tile>

            <Tile index={3} label="Facts">
                <div className="flex flex-col items-center gap-1 text-center">
                    <span className="text-lg font-bold text-slate-700">
                        {tiles.molarMass.toFixed(1)}
                        <span className="ml-1 text-xs font-medium text-slate-400">
                            g/mol
                        </span>
                    </span>
                    {tiles.facts.map((fact) => (
                        <span
                            key={fact}
                            className="text-xs font-medium text-slate-500"
                        >
                            {fact}
                        </span>
                    ))}
                </div>
            </Tile>
        </div>
    );
}
