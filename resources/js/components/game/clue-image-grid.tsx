import { motion } from 'framer-motion';

/**
 * The "4 Pics" grid: up to four clue images in a 2x2 layout.
 */
export function ClueImageGrid({ urls }: { urls: string[] }) {
    return (
        <div className="mx-auto grid w-full max-w-sm grid-cols-2 gap-2">
            {urls.map((url, i) => (
                <motion.img
                    key={url}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.08 }}
                    src={url}
                    alt={`Clue ${i + 1}`}
                    className="aspect-square w-full rounded-2xl border-2 border-foreground/10 bg-white object-cover"
                />
            ))}
        </div>
    );
}
