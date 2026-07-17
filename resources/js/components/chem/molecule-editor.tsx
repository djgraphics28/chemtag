import type * as OCLModule from 'openchemlib';
import type { CanvasEditor } from 'openchemlib';
import { useEffect, useRef, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { parseStructure, trimSafeMolfile } from '@/lib/parse-structure';

// Toolbar icons and translations; served from public/ because the package's
// exports map hides resources.json from Vite. Registered once per page even
// when several editors mount (e.g. one sketcher per answer choice).
let resourcesPromise: Promise<void> | null = null;

function registerResources(OCL: typeof OCLModule): Promise<void> {
    resourcesPromise ??= OCL.Resources.registerFromUrl(
        '/vendor/openchemlib/resources.json',
    );

    return resourcesPromise;
}

interface MoleculeEditorProps {
    /** Initial molecule: a molfile (new sketches) or SMILES (legacy rows). */
    value?: string | null;
    /**
     * Called with the current structure as a molfile whenever the sketch
     * changes ('' when the canvas is empty). Molfiles round-trip reliably
     * and keep the drawn layout — SMILES generation proved lossy/fragile.
     */
    onChange: (structure: string) => void;
}

/**
 * Chemical structure sketcher backed by OpenChemLib's CanvasEditor.
 * The library (~2 MB) is loaded lazily so it only ships on pages that sketch.
 */
export function MoleculeEditor({ value, onChange }: MoleculeEditorProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const onChangeRef = useRef(onChange);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        let editor: CanvasEditor | null = null;
        let cancelled = false;

        import('openchemlib')
            .then(async (OCL) => {
                await registerResources(OCL);

                if (cancelled || !containerRef.current) {
                    return;
                }

                editor = new OCL.CanvasEditor(containerRef.current);

                if (value) {
                    // Unparsable stored values fall back to a blank canvas
                    const molecule = parseStructure(OCL, value);

                    if (molecule) {
                        editor.setMolecule(molecule);
                    }
                }

                editor.setOnChangeListener(() => {
                    if (!editor) {
                        return;
                    }

                    const molecule = editor.getMolecule();
                    onChangeRef.current(
                        molecule.getAllAtoms() > 0
                            ? trimSafeMolfile(molecule.toMolfileV3())
                            : '',
                    );
                });

                setLoading(false);
            })
            .catch(() => {
                setLoadError(true);
                setLoading(false);
            });

        return () => {
            cancelled = true;
            editor?.destroy();
        };
        // The editor owns the molecule after mount; `value` is initial-only.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (loadError) {
        return (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                The molecule sketcher failed to load. Check your connection and
                reload the page.
            </p>
        );
    }

    return (
        <div className="relative">
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-muted/60">
                    <Spinner />
                </div>
            )}
            <div
                ref={containerRef}
                className="h-[420px] w-full overflow-hidden rounded-xl border border-input bg-white"
            />
        </div>
    );
}
