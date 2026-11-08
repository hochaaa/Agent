"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

type MascotId = "muhan" | "mudang";
type Point = { x: number; y: number };

const mascots = [
  { id: "muhan" as const, src: "/brand/muhan.png", alt: "가천대학교 마스코트 무한이" },
  { id: "mudang" as const, src: "/brand/mudang.png", alt: "가천대학교 마스코트 무당이" },
];

export function MascotStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Record<MascotId, HTMLDivElement | null>>({ muhan: null, mudang: null });
  const dragRef = useRef<{ id: MascotId; offsetX: number; offsetY: number } | null>(null);
  const [positions, setPositions] = useState<Record<MascotId, Point> | null>(null);

  const keepInsideOrbit = useCallback((id: MascotId, point: Point) => {
    const stage = stageRef.current;
    const orbit = orbitRef.current;
    const item = itemRefs.current[id];
    if (!stage || !orbit || !item) return point;

    const halfWidth = item.offsetWidth / 2;
    const halfHeight = item.offsetHeight / 2;
    const radius = orbit.clientWidth / 2;
    const orbitCenterX = orbit.offsetLeft + radius;
    const orbitCenterY = orbit.offsetTop + radius;
    const desiredCenterX = point.x + halfWidth;
    const desiredCenterY = point.y + halfHeight;
    const deltaX = desiredCenterX - orbitCenterX;
    const deltaY = desiredCenterY - orbitCenterY;
    const allowedX = Math.max(24, radius - halfWidth * .75 - 6);
    const allowedY = Math.max(24, radius - halfHeight * .75 - 6);
    const normalizedDistance = Math.hypot(deltaX / allowedX, deltaY / allowedY);
    const scale = normalizedDistance > 1 ? 1 / normalizedDistance : 1;

    return {
      x: orbitCenterX + deltaX * scale - halfWidth,
      y: orbitCenterY + deltaY * scale - halfHeight,
    };
  }, []);

  useEffect(() => {
    function fitMascots() {
      const stage = stageRef.current;
      const orbit = orbitRef.current;
      const muhan = itemRefs.current.muhan;
      const mudang = itemRefs.current.mudang;
      if (!stage || !orbit || !muhan || !mudang) return;
      const radius = orbit.clientWidth / 2;
      const centerX = orbit.offsetLeft + radius;
      const baselineY = orbit.offsetTop + orbit.clientHeight * .84;
      setPositions((current) => current ? {
        muhan: keepInsideOrbit("muhan", current.muhan),
        mudang: keepInsideOrbit("mudang", current.mudang),
      } : {
        muhan: keepInsideOrbit("muhan", {
          x: centerX - radius * .18 - muhan.offsetWidth / 2,
          y: baselineY - muhan.offsetHeight,
        }),
        mudang: keepInsideOrbit("mudang", {
          x: centerX + radius * .38 - mudang.offsetWidth / 2,
          y: baselineY - mudang.offsetHeight,
        }),
      });
    }
    fitMascots();
    window.addEventListener("resize", fitMascots);
    return () => window.removeEventListener("resize", fitMascots);
  }, [keepInsideOrbit]);

  function moveMascot(id: MascotId, point: Point) {
    setPositions((current) => current ? { ...current, [id]: keepInsideOrbit(id, point) } : current);
  }

  return (
    <div className="mascot-stage" ref={stageRef} aria-label="마우스로 이동할 수 있는 가천대학교 마스코트">
      <div className="mascot-orbit" ref={orbitRef} aria-hidden="true" />
      {mascots.map((mascot) => (
        <div
          aria-label={`${mascot.alt}. 방향키 또는 마우스로 이동`}
          className={`draggable-mascot mascot-${mascot.id}`}
          key={mascot.id}
          onKeyDown={(event) => {
            if (!positions) return;
            const step = event.shiftKey ? 20 : 6;
            const delta = {
              ArrowLeft: { x: -step, y: 0 }, ArrowRight: { x: step, y: 0 },
              ArrowUp: { x: 0, y: -step }, ArrowDown: { x: 0, y: step },
            }[event.key];
            if (!delta) return;
            event.preventDefault();
            moveMascot(mascot.id, {
              x: positions[mascot.id].x + delta.x,
              y: positions[mascot.id].y + delta.y,
            });
          }}
          onPointerDown={(event) => {
            if (!positions) return;
            const rect = event.currentTarget.getBoundingClientRect();
            dragRef.current = { id: mascot.id, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            const dragging = dragRef.current;
            const stage = stageRef.current;
            if (!dragging || dragging.id !== mascot.id || !stage) return;
            const rect = stage.getBoundingClientRect();
            moveMascot(mascot.id, {
              x: event.clientX - rect.left - dragging.offsetX,
              y: event.clientY - rect.top - dragging.offsetY,
            });
          }}
          onPointerUp={() => { dragRef.current = null; }}
          ref={(node) => { itemRefs.current[mascot.id] = node; }}
          role="button"
          style={positions ? { left: positions[mascot.id].x, top: positions[mascot.id].y } : undefined}
          tabIndex={0}
        >
          <Image alt={mascot.alt} draggable={false} fill priority sizes={mascot.id === "muhan" ? "(max-width: 640px) 210px, 280px" : "(max-width: 640px) 120px, 150px"} src={mascot.src} />
        </div>
      ))}
    </div>
  );
}
