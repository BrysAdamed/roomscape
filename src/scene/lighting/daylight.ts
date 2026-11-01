/**
 * Current daylight (0 at night, 1 in full daylight) as shown on screen, eased by the lighting rig every frame.
 * Read it inside `useFrame`; it is deliberately not React state so per-frame updates cause no re-renders.
 */
export const shownDaylight = { value: 1 };
