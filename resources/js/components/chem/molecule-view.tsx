import { useEffect, useState } from 'react';
import { parseStructure } from '@/lib/parse-structure';
import { cn } from '@/lib/utils';

/**
 * Renders a stored structure (molfile or legacy SMILES) as an SVG drawing.
 * OpenChemLib is loaded lazily and cached by the module system.
 */
export function MoleculeView({
    smiles,
    className,
    width = 320,
    height = 200,
}: {
    /** Structure data: a molfile (new sketches) or SMILES (legacy rows). */
    smiles: string;
    className?: string;
    width?: number;
    height?: number;
}) {
    const [svg, setSvg] = useState<string | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;

        import('openchemlib')
            .then((OCL) => {
                if (cancelled) {
                    return;
                }

                const molecule = parseStructure(OCL, smiles);

                if (!molecule) {
                    setFailed(true);

                    return;
                }

                setSvg(
                    molecule.toSVG(width, height, undefined, {
                        autoCrop: true,
                        autoCropMargin: 12,
                        suppressChiralText: true,
                    }),
                );
            })
            .catch(() => {
                if (!cancelled) {
                    setFailed(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [smiles, width, height]);

    if (failed) {
        return null;
    }

    return (
        <div
            className={cn(
                'mx-auto flex items-center justify-center overflow-hidden rounded-xl bg-white p-2 [&_svg]:h-auto [&_svg]:max-w-full',
                !svg && 'min-h-24 animate-pulse bg-muted',
                className,
            )}
            dangerouslySetInnerHTML={svg ? { __html: svg } : undefined}
        />
    );
}
