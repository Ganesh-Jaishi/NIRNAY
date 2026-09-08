import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { EnvironmentalConditions, PhysicsReadout } from '../../services/physicsEngine';

interface Marine3DViewProps {
  env: EnvironmentalConditions;
  physics: PhysicsReadout;
  activeRouteType: 'ORIGINAL_BLOCKED' | 'AI_OPTIMIZED' | 'WHAT_IF';
  vesselProgressPct: number;
}

export type CameraMode = 'BRIDGE' | 'BOW_VIEW' | 'DRONE';
export type TimeOfDay = 'TWILIGHT' | 'DAY' | 'BLIZZARD';

// ── Procedural Realistic Textures Generator ──────────────────
function createWaterNormalCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const imgData = ctx.createImageData(512, 512);

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const idx = (y * 512 + x) * 4;
      const noise =
        Math.sin(x * 0.08) * Math.cos(y * 0.08) * 0.5 +
        Math.sin(x * 0.2 + y * 0.15) * 0.3 +
        Math.sin((x + y) * 0.4) * 0.2;

      imgData.data[idx] = 128 + Math.floor(noise * 40); // R (Normal X)
      imgData.data[idx + 1] = 128 + Math.floor(noise * 40); // G (Normal Y)
      imgData.data[idx + 2] = 255; // B (Normal Z)
      imgData.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

function createIceTextureCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(256, 256, 50, 256, 256, 256);
  grad.addColorStop(0, '#f0f9ff');
  grad.addColorStop(0.6, '#d6eef8');
  grad.addColorStop(0.9, '#a5d8eb');
  grad.addColorStop(1, '#6ec6e6');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = 'rgba(70, 160, 200, 0.4)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 25; i++) {
    ctx.beginPath();
    ctx.moveTo(Math.random() * 512, Math.random() * 512);
    ctx.lineTo(Math.random() * 512, Math.random() * 512);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  for (let i = 0; i < 400; i++) {
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
  }

  return canvas;
}

export default function Marine3DView({
  env,
  physics,
  activeRouteType,
  vesselProgressPct,
}: Marine3DViewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [cameraMode, setCameraMode] = useState<CameraMode>('BRIDGE');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('TWILIGHT');
  const [showCockpitHUD, setShowCockpitHUD] = useState<boolean>(true);

  // Store smooth interpolated progress
  const smoothProgressRef = useRef<number>(vesselProgressPct);
  useEffect(() => {
    smoothProgressRef.current = vesselProgressPct;
  }, [vesselProgressPct]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // ── Three.js Scene Setup ──────────────────────────────────
    const scene = new THREE.Scene();
    const fogColor =
      timeOfDay === 'DAY'
        ? 0x6ca3cc
        : timeOfDay === 'BLIZZARD'
        ? 0x09182d
        : 0x07152b;
    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.FogExp2(fogColor, timeOfDay === 'BLIZZARD' ? 0.004 : 0.0018);

    const camera = new THREE.PerspectiveCamera(
      56,
      container.clientWidth / container.clientHeight,
      0.5,
      4000
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      precision: 'highp',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = timeOfDay === 'DAY' ? 1.25 : 1.1;
    container.appendChild(renderer.domElement);

    // ── Procedural Textures ───────────────────────────────────
    const waterNormalTex = new THREE.CanvasTexture(createWaterNormalCanvas());
    waterNormalTex.wrapS = THREE.RepeatWrapping;
    waterNormalTex.wrapT = THREE.RepeatWrapping;
    waterNormalTex.repeat.set(16, 16);

    const iceTex = new THREE.CanvasTexture(createIceTextureCanvas());
    iceTex.wrapS = THREE.RepeatWrapping;
    iceTex.wrapT = THREE.RepeatWrapping;
    iceTex.repeat.set(2, 2);

    // ── Realistic Polar Lighting ──────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x527fa8, timeOfDay === 'DAY' ? 1.8 : 1.3);
    scene.add(ambientLight);

    const sunColor = timeOfDay === 'TWILIGHT' ? 0xffbb77 : 0xeef8ff;
    const sunLight = new THREE.DirectionalLight(sunColor, timeOfDay === 'DAY' ? 2.8 : 2.2);
    sunLight.position.set(300, 140, -450);
    scene.add(sunLight);

    const skyFill = new THREE.HemisphereLight(0x2f6ea6, 0x041426, 1.2);
    scene.add(skyFill);

    // ── Sky Dome ──────────────────────────────────────────────
    const skyGeo = new THREE.SphereGeometry(2500, 32, 16);
    const skyMat = new THREE.MeshBasicMaterial({ color: fogColor, side: THREE.BackSide });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(sky);

    // ── Photorealistic Water Surface ──────────────────────────
    const oceanGeo = new THREE.PlaneGeometry(3500, 3500, 140, 140);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x031d38,
      roughness: 0.08,
      metalness: 0.88,
      normalMap: waterNormalTex,
      normalScale: new THREE.Vector2(0.6, 0.6),
      flatShading: true,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    scene.add(ocean);

    const posAttr = oceanGeo.attributes.position;
    const origPositions = new Float32Array(posAttr.array);

    // ── 3D Navigation Route Spline Curve ──────────────────────
    let routePoints: THREE.Vector3[];
    if (activeRouteType === 'AI_OPTIMIZED') {
      routePoints = [
        new THREE.Vector3(0, 1.5, 60),
        new THREE.Vector3(-35, 1.5, -180),
        new THREE.Vector3(-85, 1.5, -450), // Enters Sentinel-1 lead
        new THREE.Vector3(-70, 1.5, -750), // Safe from Iceberg D-28
        new THREE.Vector3(25, 1.5, -1100),
      ];
    } else if (activeRouteType === 'WHAT_IF') {
      routePoints = [
        new THREE.Vector3(0, 1.5, 60),
        new THREE.Vector3(-55, 1.5, -200),
        new THREE.Vector3(-120, 1.5, -500),
        new THREE.Vector3(-90, 1.5, -800),
        new THREE.Vector3(25, 1.5, -1100),
      ];
    } else {
      // Direct Blocked Route
      routePoints = [
        new THREE.Vector3(0, 1.5, 60),
        new THREE.Vector3(5, 1.5, -180),
        new THREE.Vector3(12, 1.5, -450), // Intersects Iceberg D-28
        new THREE.Vector3(18, 1.5, -780),
        new THREE.Vector3(25, 1.5, -1100),
      ];
    }

    const routeCurve = new THREE.CatmullRomCurve3(routePoints);

    // 3D Luminous Augmented Reality Route Ribbon
    const routeGeo = new THREE.TubeGeometry(routeCurve, 128, 2.6, 8, false);
    const routeMat = new THREE.MeshBasicMaterial({
      color: activeRouteType === 'ORIGINAL_BLOCKED' ? 0xff2244 : 0x00f59b,
      transparent: true,
      opacity: 0.8,
    });
    const routeRibbon = new THREE.Mesh(routeGeo, routeMat);
    scene.add(routeRibbon);

    // ── Realistic Irregular Sea-Ice Floes ─────────────────────
    const iceGroup = new THREE.Group();
    const floeCount = Math.floor(env.seaIceConcentrationPct * 2.5);

    for (let i = 0; i < floeCount; i++) {
      const sides = 5 + Math.floor(Math.random() * 4);
      const floeGeo = new THREE.CylinderGeometry(
        6 + Math.random() * 8,
        8 + Math.random() * 10,
        1.8,
        sides
      );
      const floeMat = new THREE.MeshStandardMaterial({
        color: 0xeaf7fc,
        roughness: 0.3,
        metalness: 0.1,
        map: iceTex,
      });
      const floe = new THREE.Mesh(floeGeo, floeMat);

      const t = Math.random();
      const pt = routeCurve.getPoint(t);
      const perpDist = (Math.random() - 0.5) * 320;
      floe.position.set(
        pt.x + perpDist,
        0.4 + Math.random() * 0.4,
        pt.z + (Math.random() - 0.5) * 120
      );
      floe.scale.set(
        1.2 + Math.random() * 2.8,
        0.8 + Math.random() * 0.5,
        1.2 + Math.random() * 2.8
      );
      floe.rotation.y = Math.random() * Math.PI * 2;
      iceGroup.add(floe);
    }
    scene.add(iceGroup);

    // ── Photorealistic Tabular Iceberg D-28 (1,636 Mt) ─────────
    const bergGroup = new THREE.Group();
    const bergGeo = new THREE.CylinderGeometry(55, 75, 45, 9);
    const bergMat = new THREE.MeshStandardMaterial({
      color: 0xd6f3fc,
      roughness: 0.25,
      metalness: 0.15,
      map: iceTex,
      flatShading: true,
    });
    const bergMesh = new THREE.Mesh(bergGeo, bergMat);
    bergMesh.position.set(0, 22, 0);
    bergMesh.scale.set(3.2, 1.8, 2.4);
    bergGroup.add(bergMesh);

    // Subsurface Cyan Glow Shelf
    const shelfGeo = new THREE.CylinderGeometry(85, 110, 15, 9);
    const shelfMat = new THREE.MeshStandardMaterial({
      color: 0x00c4e8,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.6,
    });
    const shelfMesh = new THREE.Mesh(shelfGeo, shelfMat);
    shelfMesh.position.set(0, -6, 0);
    shelfMesh.scale.set(3.4, 1.0, 2.6);
    bergGroup.add(shelfMesh);

    const beaconLight = new THREE.PointLight(0xff2244, 6, 350);
    beaconLight.position.set(0, 75, 0);
    bergGroup.add(beaconLight);

    if (activeRouteType === 'ORIGINAL_BLOCKED') {
      bergGroup.position.set(12, 0, -450);
    } else {
      bergGroup.position.set(180, 0, -450);
    }
    scene.add(bergGroup);

    // ── Floating 3D Holographic Waypoint Gates ─────────────────
    const wpGroup = new THREE.Group();
    [0.2, 0.45, 0.7, 0.95].forEach((tVal) => {
      const pt = routeCurve.getPoint(tVal);
      const ringGeo = new THREE.TorusGeometry(14, 1.0, 8, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: activeRouteType === 'ORIGINAL_BLOCKED' ? 0xff334b : 0x00d2ff,
        wireframe: true,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(pt.x, pt.y + 14, pt.z);
      ring.rotation.x = Math.PI / 2;
      wpGroup.add(ring);
    });
    scene.add(wpGroup);

    // ── Polar Blizzard Particle System ────────────────────────
    const snowCount = 1800;
    const snowGeo = new THREE.BufferGeometry();
    const snowPositions = new Float32Array(snowCount * 3);
    for (let i = 0; i < snowCount * 3; i += 3) {
      snowPositions[i] = (Math.random() - 0.5) * 600;
      snowPositions[i + 1] = Math.random() * 120;
      snowPositions[i + 2] = (Math.random() - 0.5) * 600;
    }
    snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
    const snowMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,
      transparent: true,
      opacity: 0.85,
    });
    const snowParticles = new THREE.Points(snowGeo, snowMat);
    scene.add(snowParticles);

    // ── Vessel Model (PC-3 Research Vessel) ───────────────────
    const vesselGroup = new THREE.Group();

    // Red Bow Hull
    const hullGeo = new THREE.ConeGeometry(16, 48, 4);
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x9b1c1c,
      roughness: 0.3,
      metalness: 0.5,
    });
    const hullMesh = new THREE.Mesh(hullGeo, hullMat);
    hullMesh.rotation.x = Math.PI / 2;
    hullMesh.rotation.y = Math.PI / 4;
    hullMesh.position.set(0, -3.5, -18);
    hullMesh.scale.set(1, 1.4, 0.85);
    vesselGroup.add(hullMesh);

    // Deckhouse
    const deckGeo = new THREE.BoxGeometry(16, 8, 22);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0xddedfa, roughness: 0.4 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(0, 3, 10);
    vesselGroup.add(deck);

    // Mast
    const mastGeo = new THREE.CylinderGeometry(0.4, 0.6, 18, 8);
    const mastMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8 });
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(0, 10, -8);
    vesselGroup.add(mast);

    scene.add(vesselGroup);

    // ── Smooth Damped Mouse Look ──────────────────────────────
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let targetYaw = 0;
    let targetPitch = 0;
    let currentYaw = 0;
    let currentPitch = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dX = e.clientX - prevMouseX;
      const dY = e.clientY - prevMouseY;
      targetYaw -= dX * 0.0025;
      targetPitch = Math.max(-0.35, Math.min(0.35, targetPitch - dY * 0.0025));
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };
    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // ── Ultra-Smooth 60FPS Render & Interpolation Loop ────────
    let animationId: number;
    const startTime = performance.now();
    let currentT = Math.min(0.999, Math.max(0.001, vesselProgressPct / 100));

    // Smooth camera target vectors
    const currentCamPos = new THREE.Vector3();
    const currentLookTarget = new THREE.Vector3();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) * 0.001;

      // Smooth progress interpolation (LERP)
      const targetT = Math.min(0.999, Math.max(0.001, smoothProgressRef.current / 100));
      currentT = THREE.MathUtils.lerp(currentT, targetT, 0.08);

      // Smooth mouse yaw & pitch damping
      currentYaw = THREE.MathUtils.lerp(currentYaw, targetYaw, 0.1);
      currentPitch = THREE.MathUtils.lerp(currentPitch, targetPitch, 0.1);

      // 1. Calculate Vessel Position and Tangent on Spline
      const curPos = routeCurve.getPointAt(currentT);
      const tangent = routeCurve.getTangentAt(currentT).normalize();

      vesselGroup.position.copy(curPos);
      vesselGroup.position.y = 0;

      const targetRotationY = Math.atan2(-tangent.x, -tangent.z);
      vesselGroup.rotation.y = THREE.MathUtils.lerp(vesselGroup.rotation.y, targetRotationY, 0.1);

      // Natural Ocean Wave Roll and Pitch on Vessel
      const waveRoll = Math.sin(elapsed * 1.3) * (0.02 + env.waveHeightMeters * 0.005);
      const wavePitch = Math.cos(elapsed * 1.6) * (0.018 + env.waveHeightMeters * 0.004);
      vesselGroup.rotation.z = waveRoll;
      vesselGroup.rotation.x = wavePitch;

      // 2. Smooth Camera Interpolation (Silky Smooth LERP)
      let targetCamPos: THREE.Vector3;
      let targetLook: THREE.Vector3;

      if (cameraMode === 'BRIDGE') {
        targetCamPos = new THREE.Vector3(curPos.x, 8.5, curPos.z + 6);
        targetLook = new THREE.Vector3(
          curPos.x + tangent.x * 140,
          curPos.y + 2,
          curPos.z + tangent.z * 140
        );
      } else if (cameraMode === 'BOW_VIEW') {
        targetCamPos = new THREE.Vector3(
          curPos.x + tangent.x * 24,
          3.5,
          curPos.z + tangent.z * 24
        );
        targetLook = new THREE.Vector3(
          curPos.x + tangent.x * 160,
          curPos.y + 1,
          curPos.z + tangent.z * 160
        );
      } else {
        // DRONE FOLLOW CAMERA
        const followOffset = new THREE.Vector3(-tangent.x * 85, 42, -tangent.z * 85);
        targetCamPos = new THREE.Vector3().copy(curPos).add(followOffset);
        targetLook = new THREE.Vector3(curPos.x, curPos.y + 6, curPos.z);
      }

      currentCamPos.lerp(targetCamPos, 0.12);
      currentLookTarget.lerp(targetLook, 0.12);

      camera.position.copy(currentCamPos);
      camera.lookAt(currentLookTarget);
      camera.rotation.y += currentYaw;
      camera.rotation.x += currentPitch;

      // 3. Multi-Octave Wave Swell Animation
      const waveFreq = 0.8 + env.waveHeightMeters * 0.15;
      const waveAmp = 0.4 + env.waveHeightMeters * 0.35;
      const pos = oceanGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const u = origPositions[i * 3];
        const v = origPositions[i * 3 + 1];
        pos.setZ(
          i,
          Math.sin(u * 0.035 + elapsed * waveFreq) *
            Math.cos(v * 0.035 + elapsed * waveFreq) *
            waveAmp +
            Math.sin((u + v) * 0.07 + elapsed * 1.5) * (waveAmp * 0.25)
        );
      }
      pos.needsUpdate = true;

      waterNormalTex.offset.x += 0.0006;
      waterNormalTex.offset.y += 0.0004;

      ocean.position.set(curPos.x, 0, curPos.z);
      sky.position.set(curPos.x, 0, curPos.z);

      // 4. Animate Waypoint Torus Rings
      wpGroup.children.forEach((child, idx) => {
        child.rotation.z += 0.015 * (idx % 2 === 0 ? 1 : -1);
      });

      // 5. Snow Particles
      const snowPos = snowGeo.attributes.position;
      const windDrift = (env.windSpeedKnots / 22) * 1.0;
      for (let i = 0; i < snowCount * 3; i += 3) {
        snowPos.setY(i / 3, snowPos.getY(i / 3) - 0.5);
        snowPos.setX(i / 3, snowPos.getX(i / 3) + windDrift);
        if (snowPos.getY(i / 3) < 0) {
          snowPos.setY(i / 3, 90);
          snowPos.setX(i / 3, curPos.x + (Math.random() - 0.5) * 500);
          snowPos.setZ(i / 3, curPos.z + (Math.random() - 0.5) * 500);
        }
      }
      snowPos.needsUpdate = true;

      beaconLight.intensity = 3.0 + Math.sin(elapsed * 5) * 3.0;

      renderer.render(scene, camera);
    };

    animate();

    // ── Resize Handler ────────────────────────────────────────
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', onResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [env, physics, activeRouteType, cameraMode, timeOfDay]);

  return (
    <div className="relative w-full h-full bg-[#030914] overflow-hidden select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* ── REALISTIC BRIDGE COCKPIT OVERLAY (WINDSHIELD & HELM CONSOLE) ── */}
      {showCockpitHUD && cameraMode === 'BRIDGE' && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between">
          <div className="h-10 bg-gradient-to-b from-black/80 to-transparent border-b border-cyan-500/20" />

          <div className="bg-gradient-to-t from-[#060e1d] via-[#09152b]/95 to-transparent pt-8 pb-3 px-6 border-t-2 border-[#1e3559] flex items-center justify-between pointer-events-auto shadow-2xl">
            <div className="flex items-center gap-4 font-mono">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-300 font-black">
                🧭
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">AUTOPILOT GYRO HEADING</div>
                <div className="text-base font-black text-cyan-300">
                  082° ENE · SOG: {physics.effectiveSpeedKnots} KTS · DRAFT: 8.5m
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-[#060d19] border border-[#1e3559]">
                <span className="text-slate-400">AI ICE RADAR: </span>
                <span className="text-cyan-300 font-bold">SIC {env.seaIceConcentrationPct}% ({env.iceThicknessMeters}m)</span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#060d19] border border-[#1e3559]">
                <span className="text-slate-400">HULL DRAG: </span>
                <span className="text-emerald-400 font-bold">{physics.vesselIceResistanceKN} kN</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TOP CONTROLS HUD ── */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto z-20">
        <div className="flex items-center bg-[#0c182b]/95 border-2 border-[#1e3559] p-1.5 rounded-xl shadow-2xl backdrop-blur-md gap-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 px-2 uppercase">Camera:</span>
          {(['BRIDGE', 'BOW_VIEW', 'DRONE'] as CameraMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setCameraMode(mode)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                cameraMode === mode
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{mode === 'BRIDGE' ? '🚢 Bridge Cockpit' : mode === 'BOW_VIEW' ? '⚓ Bow Water Eye' : '🚁 Drone Follow'}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center bg-[#0c182b]/95 border-2 border-[#1e3559] p-1.5 rounded-xl shadow-2xl backdrop-blur-md gap-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 px-2 uppercase">Atmosphere:</span>
          {(['TWILIGHT', 'DAY', 'BLIZZARD'] as TimeOfDay[]).map((tod) => (
            <button
              key={tod}
              onClick={() => setTimeOfDay(tod)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                timeOfDay === tod
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {tod === 'TWILIGHT' ? '🌅 Twilight' : tod === 'DAY' ? '☀️ Polar Day' : '❄️ Blizzard'}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-[#0c182b]/95 border-2 border-[#1e3559] p-1.5 rounded-xl shadow-2xl backdrop-blur-md gap-2">
          <button
            onClick={() => setShowCockpitHUD(!showCockpitHUD)}
            className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-slate-300 hover:text-white cursor-pointer"
          >
            {showCockpitHUD ? '👁️ Cockpit HUD On' : '🕶️ Clean Cam'}
          </button>
        </div>
      </div>

      {/* ── AR TARGET SCANNER: DYNAMIC ICEBERG DISTANCE SCAN ── */}
      {activeRouteType === 'ORIGINAL_BLOCKED' ? (
        <div className="absolute top-16 right-6 z-20 bg-red-950/90 border-2 border-red-500 rounded-xl p-3 text-xs font-mono shadow-2xl backdrop-blur-md space-y-1 animate-pulse">
          <div className="text-red-400 font-black flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            FORWARD LiDAR: ICEBERG D-28
          </div>
          <div className="text-sm font-bold text-white">
            Range: {Math.max(0.4, (1 - vesselProgressPct / 55) * 4.2).toFixed(1)} km · Bearing: 084°
          </div>
          <div className="text-[10px] text-red-200">
            {vesselProgressPct > 45 ? '⚠️ IMMEDIATE COLLISION THREAT' : 'CPA: 18 min · Evasive turn required'}
          </div>
        </div>
      ) : (
        <div className="absolute top-16 left-6 z-20 bg-emerald-950/90 border-2 border-emerald-400 rounded-xl p-3 text-xs font-mono shadow-2xl backdrop-blur-md space-y-1">
          <div className="text-emerald-400 font-black flex items-center gap-1.5">
            <span>✓</span>
            <span>SENTINEL-1 SAR LEAD CHANNEL</span>
          </div>
          <div className="text-sm font-bold text-white">Open Water Fracture Ahead</div>
          <div className="text-[10px] text-emerald-200">
            Iceberg D-28 Clearance: 38.4 km Starboard
          </div>
        </div>
      )}

      {/* Bottom Subtitle / Mouse Interaction Helper */}
      <div className="absolute bottom-16 left-4 z-20 bg-black/75 border border-white/20 px-3 py-1 rounded-lg text-[11px] font-mono text-slate-300 backdrop-blur-sm pointer-events-none">
        🖱️ Click & Drag for smooth 360° pan across the Antarctic Ocean
      </div>
    </div>
  );
}
