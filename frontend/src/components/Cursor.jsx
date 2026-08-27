import { useEffect, useRef, useState } from "react";

export default function Cursor() {
  const dot = useRef(null);
  const ring = useRef(null);

  const mouse = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  });

  const pos = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  });

  const [hover, setHover] = useState(false);

  useEffect(() => {
    let animId;

    const move = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target.closest &&
        target.closest("a, button, input, select, textarea, .card, [role='button']")
      ) {
        setHover(true);
      } else {
        setHover(false);
      }
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", handleMouseOver);

    const animate = () => {
      pos.current.x += (mouse.current.x - pos.current.x) * 0.15;
      pos.current.y += (mouse.current.y - pos.current.y) * 0.15;

      if (dot.current) {
        dot.current.style.transform = `translate(${mouse.current.x}px, ${mouse.current.y}px) translate(-50%, -50%)`;
      }

      if (ring.current) {
        ring.current.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%) scale(${
          hover ? 1.6 : 1
        })`;
      }

      animId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", handleMouseOver);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [hover]);

  return (
    <>
      {/* Small Dot */}
      <div
        ref={dot}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "10px",
          height: "10px",
          background: "#60a5fa",
          borderRadius: "50%",
          zIndex: 2147483647,
          pointerEvents: "none",
          boxShadow: "0 0 10px #3b82f6",
        }}
      />

      {/* Ring */}
      <div
        ref={ring}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          border: "2px solid rgba(96, 165, 250, 0.8)",
          background: "rgba(59, 130, 246, 0.08)",
          backdropFilter: "blur(4px)",
          pointerEvents: "none",
          transition: "transform 0.18s ease, width 0.2s, height 0.2s",
          boxShadow: "0 0 30px rgba(59, 130, 246, 0.7)",
          zIndex: 99998,
        }}
      />
    </>
  );
}