// src/components/ChromaGrid.tsx

import React, { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { Link } from "react-router-dom";

// Describes the shape of a single item in the grid.
export interface ChromaItem {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  handle?: string;
  role?: string;
  borderColor?: string;
  gradient?: string;
  linkUrl: string;
}

// Props for the ChromaGrid component itself.
export interface ChromaGridProps {
  items: ChromaItem[];
  className?: string;
  radius?: number;
  damping?: number; // How quickly the spotlight follows the mouse (higher is slower)
  fadeOut?: number;
  ease?: string;
}

type SetterFn = (v: number | string) => void;

const ChromaGrid: React.FC<ChromaGridProps> = ({
  items,
  className = "",
  radius = 350, // Increased radius for a softer spotlight
  damping = 0.6, // Increased damping for smoother animation
  fadeOut = 0.8, // Slower fade out
  ease = "power4.out", // A smoother easing function
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const setX = useRef<SetterFn | null>(null);
  const setY = useRef<SetterFn | null>(null);
  const pos = useRef({ x: 0, y: 0 });

  // Initialize GSAP and set initial position
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    setX.current = gsap.quickSetter(el, "--x", "px") as SetterFn;
    setY.current = gsap.quickSetter(el, "--y", "px") as SetterFn;
    const { width, height } = el.getBoundingClientRect();
    pos.current = { x: width / 2, y: height / 2 };
    setX.current(pos.current.x);
    setY.current(pos.current.y);
  }, []);

  // Animate the spotlight to the mouse position
  const moveTo = (x: number, y: number) => {
    gsap.to(pos.current, {
      x,
      y,
      duration: damping,
      ease,
      onUpdate: () => {
        setX.current?.(pos.current.x);
        setY.current?.(pos.current.y);
      },
      overwrite: true,
    });
  };

  // Handlers for mouse movement on the main grid
  const handleMove = (e: React.PointerEvent) => {
    const r = rootRef.current!.getBoundingClientRect();
    moveTo(e.clientX - r.left, e.clientY - r.top);
    gsap.to(fadeRef.current, { opacity: 0, duration: 0.4, overwrite: true });
  };

  const handleLeave = () => {
    gsap.to(fadeRef.current, {
      opacity: 1,
      duration: fadeOut,
      overwrite: true,
    });
  };

  // Handler for individual card hover to position their own effects
  const handleCardMove: React.MouseEventHandler<HTMLElement> = (e) => {
    const c = e.currentTarget as HTMLElement;
    const rect = c.getBoundingClientRect();
    c.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    c.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={rootRef}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className={`relative w-full h-full flex flex-wrap justify-center items-start gap-6 p-4 ${className}`}
      style={
        {
          "--r": `${radius}px`,
          "--x": "50%",
          "--y": "50%",
        } as React.CSSProperties
      }
    >
      {items.map((item) => (
        <article
          key={item.id}
          onMouseMove={handleCardMove}
          className="group relative flex flex-col w-[300px] rounded-2xl overflow-hidden transition-all duration-500"
          style={
            {
              background: item.gradient,
              "--spotlight-color": "rgba(255, 255, 255, 0.25)",
              "--glow-color": item.borderColor || "#fff",
            } as React.CSSProperties
          }
        >
          {/* Base border and glowing border effect */}
          <div className="absolute inset-0 z-0 transition-colors duration-300 bg-transparent border-2 border-slate-800 rounded-2xl group-hover:border-[var(--glow-color)]" />
          <div
            className="absolute inset-0 z-10 opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at var(--mouse-x) var(--mouse-y), var(--glow-color), transparent 40%)`,
              filter: "blur(20px)",
            }}
          />

          {/* Individual card spotlight */}
          <div
            className="absolute inset-0 z-20 transition-opacity duration-500 pointer-events-none opacity-0 group-hover:opacity-100"
            style={{
              background: `radial-gradient(circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color), transparent 75%)`,
            }}
          />

          <Link to={item.linkUrl} className="relative z-30 contents">
            <div className="flex-1 p-2.5">
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                className="w-full h-[280px] object-cover rounded-lg"
              />
            </div>
            <footer className="p-4 text-white font-sans grid grid-cols-[1fr_auto] gap-x-3 gap-y-1">
              <h3 className="m-0 text-base font-semibold">{item.title}</h3>
              {item.handle && (
                <span className="text-sm opacity-70 text-right">
                  {item.handle}
                </span>
              )}
              <p className="m-0 col-span-full text-sm opacity-80 line-clamp-2">
                {item.subtitle}
              </p>
            </footer>
          </Link>
        </article>
      ))}

      {/* Main spotlight mask for grayscale effect */}
      <div
        className="absolute inset-0 pointer-events-none z-40"
        style={{
          backdropFilter: "grayscale(1) brightness(0.6)",
          WebkitBackdropFilter: "grayscale(1) brightness(0.6)",
          background: "transparent",
          maskImage: `radial-gradient(circle var(--r) at var(--x) var(--y), transparent 25%, black 100%)`,
          WebkitMaskImage: `radial-gradient(circle var(--r) at var(--x) var(--y), transparent 25%, black 100%)`,
        }}
      />
      {/* Fade overlay */}
      <div
        ref={fadeRef}
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 z-50"
        style={{
          backdropFilter: "grayscale(1) brightness(0.6)",
          WebkitBackdropFilter: "grayscale(1) brightness(0.6)",
          background: "transparent",
          opacity: 1,
        }}
      />
    </div>
  );
};

export default ChromaGrid;
