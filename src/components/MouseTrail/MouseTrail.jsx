import { useEffect, useRef } from "react";
import "./MouseTrail.css";

export default function MouseTrail() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let W = 0;
    let H = 0;
    const points = [];
    let hue = Math.floor(Math.random() * 360);
    let running = true;
    let rafId = null;

    const DPR = window.devicePixelRatio || 1;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    resize();
    window.addEventListener("resize", resize);

    function onVisibility() {
      running = !document.hidden;
      if (running) {
        rafId = requestAnimationFrame(loop);
      }
    }
    document.addEventListener("visibilitychange", onVisibility);

    function addPoint(x, y) {
      points.push({ x, y, life: 1 });
      if (points.length > 200) {
        points.shift();
      }
    }

    function onMove(e) {
      addPoint(e.clientX, e.clientY);
    }
    function onTouch(e) {
      const t = e.touches[0];
      if (t) {
        addPoint(t.clientX, t.clientY);
      }
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onTouch, { passive: true });

    function loop() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      hue = (hue + 0.4) % 360;
      for (let i = points.length - 1; i >= 0; i--) {
        points[i].life -= 0.018;
        if (points[i].life <= 0) {
          points.splice(i, 1);
        }
      }
      if (points.length > 1) {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        for (let i = 1; i < points.length; i++) {
          const p0 = points[i - 1];
          const p1 = points[i];
          const t = i / points.length;
          ctx.strokeStyle = `hsla(${hue},60%,62%,${(p1.life * 0.4).toFixed(3)})`;
          ctx.lineWidth = t * 5 + 0.4;
          const mx = (p0.x + p1.x) / 2;
          const my = (p0.y + p1.y) / 2;
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.quadraticCurveTo(p0.x, p0.y, mx, my);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }
      }
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onTouch);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="mouse-trail-canvas" aria-hidden="true" />;
}
