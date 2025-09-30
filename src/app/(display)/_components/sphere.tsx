"use client";
// @ts-nocheck
import React from "react";
import * as THREE from "three";

type RGB = [number, number, number];

type SphereProps = {
  colors: (RGB | string)[];
  pointSize?: number;
  pointOpacity?: number;
} & React.HTMLAttributes<HTMLDivElement>;

const parseColorToRGB = (value: RGB | string): RGB => {
  if (Array.isArray(value)) return value;
  const numbers = value
    .replace(/rgb\(/i, "")
    .replace(/\)/, "")
    .split(/\s*,\s*/)
    .map((v) => Number(v));
  if (numbers.length === 3 && numbers.every((n) => Number.isFinite(n))) {
    return [numbers[0], numbers[1], numbers[2]];
  }
  return [0, 0, 0];
};

const rgbToUnitPosition = (rgb: RGB): [number, number, number] => {
  // Map in "irosphere" style using HSL color solid on a sphere:
  // Hue -> azimuth (longitude), Saturation -> radial distance, Lightness -> vertical (height)
  // Radius is capped by sqrt(1 - y^2) to stay on/inside the unit sphere
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;

  // RGB [0,1] -> HSL (h in degrees [0,360), s,l in [0,1])
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    s = Number.isFinite(s) ? s : 0;
    s = Math.max(0, Math.min(1, s));
    switch (max) {
      case r:
        h = ((g - b) / delta) % 6;
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      default:
        h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  // Height from lightness
  const y = Math.max(-1, Math.min(1, 2 * l - 1));
  const rMax = Math.sqrt(Math.max(0, 1 - y * y));
  const radius = s * rMax;
  const rad = (h * Math.PI) / 180;
  const x = radius * Math.cos(rad);
  const z = radius * Math.sin(rad);
  return [x, y, z];
};

export const Sphere: React.FC<SphereProps> = ({
  colors,
  className,
  pointSize = 0.08,
  pointOpacity = 1,
  ...rest
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  type MinimalRenderer = {
    setPixelRatio: (n: number) => void;
    setSize: (w: number, h: number) => void;
    dispose: () => void;
    domElement: HTMLElement;
  };
  type MinimalCamera = {
    position: { set: (x: number, y: number, z: number) => void; z: number };
    aspect: number;
    updateProjectionMatrix: () => void;
  };
  type MinimalGroup = {
    rotation: { x: number; y: number };
    add: (obj: unknown) => void;
    remove: (obj: unknown) => void;
  };
  type MinimalPoints = {
    geometry: { dispose: () => void };
    material: { dispose: () => void };
  };
  type ThreeRefs = {
    renderer: MinimalRenderer;
    scene: unknown;
    camera: MinimalCamera;
    group: MinimalGroup;
    points?: MinimalPoints;
  };
  const threeRef = React.useRef<ThreeRefs | null>(null);

  const draggingRef = React.useRef(false);
  const lastRef = React.useRef<{ x: number; y: number } | null>(null);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 2.6);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(3, 3, 3);
    scene.add(dir);

    const group = new THREE.Group();
    scene.add(group);

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 32, 32),
      new THREE.MeshStandardMaterial({
        color: "#000",
        wireframe: true,
        transparent: true,
        opacity: 0.1,
      })
    );
    group.add(sphere);

    threeRef.current = { renderer, scene, camera, group };

    const animate = () => {
      if (!threeRef.current) return;
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!threeRef.current || !container) return;
      const w = container.clientWidth || width;
      const h = container.clientHeight || height;
      threeRef.current.renderer.setSize(w, h);
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    const onPointerDown = (e: PointerEvent) => {
      draggingRef.current = true;
      lastRef.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = () => {
      draggingRef.current = false;
      lastRef.current = null;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current || !threeRef.current || !lastRef.current) return;
      const dx = e.clientX - lastRef.current.x;
      const dy = e.clientY - lastRef.current.y;
      threeRef.current.group.rotation.y += dx * 0.005;
      threeRef.current.group.rotation.x += dy * 0.005;
      lastRef.current = { x: e.clientX, y: e.clientY };
    };
    const onWheel = (e: WheelEvent) => {
      if (!threeRef.current) return;
      const z = threeRef.current.camera.position.z * (e.deltaY > 0 ? 1.1 : 0.9);
      threeRef.current.camera.position.z = Math.min(10, Math.max(1.5, z));
    };

    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointerleave", onPointerUp);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("wheel", onWheel, { passive: true });

    return () => {
      window.removeEventListener("resize", onResize);
      container.removeEventListener("pointerdown", onPointerDown);
      container.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointerleave", onPointerUp);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("wheel", onWheel);
      if (threeRef.current) {
        threeRef.current.renderer.dispose();
        container.removeChild(threeRef.current.renderer.domElement);
      }
      threeRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    if (!threeRef.current) return;
    const { group } = threeRef.current;
    // remove previous points
    if (threeRef.current.points) {
      group.remove(threeRef.current.points);
      threeRef.current.points.geometry.dispose();
      threeRef.current.points.material.dispose();
      threeRef.current.points = undefined;
    }

    if (!colors || colors.length === 0) return;
    const pos = new Float32Array(colors.length * 3);
    const cols = new Float32Array(colors.length * 3);
    colors.forEach((c, i) => {
      const rgb = parseColorToRGB(c);
      const [x, y, z] = rgbToUnitPosition(rgb);
      pos[i * 3 + 0] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      cols[i * 3 + 0] = rgb[0] / 255;
      cols[i * 3 + 1] = rgb[1] / 255;
      cols[i * 3 + 2] = rgb[2] / 255;
    });
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geom.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
    const mat = new THREE.PointsMaterial({
      size: pointSize,
      vertexColors: true,
      sizeAttenuation: true,
      depthWrite: true,
      depthTest: true,
      transparent: pointOpacity < 1,
      opacity: Math.max(0, Math.min(1, pointOpacity)),
    });
    const points = new THREE.Points(geom, mat);
    group.add(points);
    threeRef.current.points = points;
  }, [colors, pointSize, pointOpacity]);

  return (
    <div
      ref={containerRef}
      className={"relative h-full min-h-40 w-full overflow-hidden " + (className ?? "")}
      {...rest}
    />
  );
};
