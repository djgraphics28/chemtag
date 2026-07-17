import type { SVGAttributes } from 'react';

/**
 * Fallback brand mark when no logo is uploaded in admin settings:
 * a benzene ring (hexagon with the aromatic circle).
 */
export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 40 42" xmlns="http://www.w3.org/2000/svg">
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M20 2.5 35.6 11.5 35.6 29.5 20 38.5 4.4 29.5 4.4 11.5Z
                   M20 6.96 8.26 13.73 8.26 27.27 20 34.04 31.74 27.27 31.74 13.73Z
                   M20 12.75 A8.25 8.25 0 1 0 20 29.25 A8.25 8.25 0 1 0 20 12.75Z
                   M20 15.5 A5.5 5.5 0 1 1 20 26.5 A5.5 5.5 0 1 1 20 15.5Z"
            />
        </svg>
    );
}
