// Fallback ambient declarations to make ESLint/TS happy in editors.
// Prefer real types from @react-three/fiber / drei when resolver picks them up.

declare module "@react-three/fiber";
declare module "@react-three/drei";
declare module "three";

declare namespace JSX {
  interface IntrinsicElements {
    // three.js / r3f tags used in this project
    group: Record<string, unknown>;
    points: Record<string, unknown>;
    bufferGeometry: Record<string, unknown>;
    bufferAttribute: Record<string, unknown>;
    pointsMaterial: Record<string, unknown>;
    ambientLight: Record<string, unknown>;
    directionalLight: Record<string, unknown>;
    mesh: Record<string, unknown>;
    sphereGeometry: Record<string, unknown>;
    meshStandardMaterial: Record<string, unknown>;
  }
}
