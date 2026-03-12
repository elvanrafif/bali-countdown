import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** Convert lat/lon degrees to a point on a unit sphere */
function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

export function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // ── Core ─────────────────────────────────────────────────────────────────
    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(42, W / H, 0.1, 100);
    camera.position.z = 3.4;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Star field ───────────────────────────────────────────────────────────
    const STARS = 1400;
    const starPos = new Float32Array(STARS * 3);
    for (let i = 0; i < STARS; i++) {
      const r = 18 + Math.random() * 10;
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      starPos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i * 3 + 2] = r * Math.cos(phi);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.06, color: 0xffffff, transparent: true, opacity: 0.55, sizeAttenuation: true,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // ── Globe group (everything that rotates together) ────────────────────────
    const globeGroup = new THREE.Group();
    // Orient to show SE Asia (Bali lon ~115°E) facing front at load
    globeGroup.rotation.y = -2.15;
    globeGroup.rotation.x =  0.18;
    scene.add(globeGroup);

    // 1. Main sphere — deep ocean navy
    const globeMat = new THREE.MeshPhongMaterial({
      color:    new THREE.Color('#071525'),
      emissive: new THREE.Color('#0e2240'),
      specular: new THREE.Color('#1a4080'),
      shininess: 45,
    });
    globeGroup.add(new THREE.Mesh(new THREE.SphereGeometry(1, 72, 52), globeMat));

    // 2. Latitude / longitude grid — faint lines
    const gridEdges = new THREE.EdgesGeometry(new THREE.SphereGeometry(1.003, 24, 16));
    globeGroup.add(new THREE.LineSegments(gridEdges, new THREE.LineBasicMaterial({
      color: new THREE.Color('#1e3d70'), transparent: true, opacity: 0.30,
    })));

    // 3. Atmosphere shell (front face, additive glow)
    const atmMat = new THREE.MeshPhongMaterial({
      color: 0x1d4ed8, transparent: true, opacity: 0.07,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.10, 32, 32), atmMat));

    // 4. Rim light shell (back face)
    const rimMat = new THREE.MeshPhongMaterial({
      color: 0x38bdf8, transparent: true, opacity: 0.055,
      side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.14, 32, 32), rimMat));

    // ── Location markers ─────────────────────────────────────────────────────
    // Bali: 8.4°S, 115.2°E
    const BALI_POS     = latLonToVec3(-8.4,  115.2, 1.0);
    // Jakarta: 6.2°S, 106.8°E
    const JAKARTA_POS  = latLonToVec3(-6.2,  106.8, 1.0);

    // Bali — orange dot + pulse ring
    const baliCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xf97316 }),
    );
    baliCore.position.copy(BALI_POS);
    globeGroup.add(baliCore);

    const baliPulseMat = new THREE.MeshBasicMaterial({
      color: 0xf97316, transparent: true, opacity: 0.3,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const baliPulse = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12), baliPulseMat);
    baliPulse.position.copy(BALI_POS);
    globeGroup.add(baliPulse);

    // "BALI" label ring — small torus laying flat on surface
    const baliRingMat = new THREE.MeshBasicMaterial({
      color: 0xfb923c, transparent: true, opacity: 0.45,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const baliRing = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.005, 8, 32), baliRingMat);
    baliRing.position.copy(BALI_POS);
    baliRing.lookAt(new THREE.Vector3(0, 0, 0)); // face center → ring is tangent to surface
    baliRing.rotateX(Math.PI / 2);
    globeGroup.add(baliRing);

    // Jakarta — small slate dot
    const jakartaDot = new THREE.Mesh(
      new THREE.SphereGeometry(0.013, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x64748b }),
    );
    jakartaDot.position.copy(JAKARTA_POS);
    globeGroup.add(jakartaDot);

    // ── Flight path arc ───────────────────────────────────────────────────────
    // Control point arcs outward from the surface
    const arcCtrl = BALI_POS.clone().add(JAKARTA_POS).normalize().multiplyScalar(1.5);
    const flightCurve = new THREE.QuadraticBezierCurve3(
      JAKARTA_POS.clone(), arcCtrl, BALI_POS.clone(),
    );
    const arcPoints = flightCurve.getPoints(80);
    const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPoints);
    const arcMat = new THREE.LineDashedMaterial({
      color: 0xfbbf24, dashSize: 0.038, gapSize: 0.022,
      transparent: true, opacity: 0.75,
    });
    const arcLine = new THREE.Line(arcGeo, arcMat);
    arcLine.computeLineDistances();
    globeGroup.add(arcLine);

    // Plane marker — bright amber sphere that travels the arc
    const planeMat = new THREE.MeshBasicMaterial({ color: 0xfef3c7 });
    const planeDot = new THREE.Mesh(new THREE.SphereGeometry(0.019, 8, 8), planeMat);
    globeGroup.add(planeDot);

    // Plane trail glow
    const trailMat = new THREE.MeshBasicMaterial({
      color: 0xfde68a, transparent: true, opacity: 0.25,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const planeTail = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), trailMat);
    globeGroup.add(planeTail);

    // ── Lights ───────────────────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.08));

    const keyLight = new THREE.DirectionalLight(new THREE.Color('#bfdbfe'), 1.4);
    keyLight.position.set(6, 4, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(new THREE.Color('#0ea5e9'), 0.5);
    fillLight.position.set(-6, -2, -4);
    scene.add(fillLight);

    // ── Drag to rotate ───────────────────────────────────────────────────────
    let dragging  = false;
    let prev      = { x: 0, y: 0 };
    let velY      = 0;
    let velX      = 0;

    const startDrag = (x: number, y: number) => {
      dragging = true; prev = { x, y }; velX = 0; velY = 0;
    };
    const moveDrag = (x: number, y: number) => {
      if (!dragging) return;
      velY = (x - prev.x) * 0.006;
      velX = (y - prev.y) * 0.006;
      prev = { x, y };
    };
    const endDrag = () => { dragging = false; };

    mount.addEventListener('mousedown',  e => startDrag(e.clientX, e.clientY));
    window.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
    window.addEventListener('mouseup',   endDrag);
    mount.addEventListener('touchstart', e => startDrag(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    window.addEventListener('touchmove', e => moveDrag(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
    window.addEventListener('touchend',  endDrag);

    // ── Resize ───────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // ── Animate ──────────────────────────────────────────────────────────────
    let raf: number;
    let t = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      t += 0.006;

      if (dragging) {
        globeGroup.rotation.y += velY;
        globeGroup.rotation.x += velX;
        velY *= 0.85;
        velX *= 0.85;
      } else {
        // Gently spin + dampen leftover velocity
        globeGroup.rotation.y += 0.0018 + velY;
        globeGroup.rotation.x += velX;
        velY *= 0.92;
        velX *= 0.92;
      }

      // Plane along the arc (loops back and forth)
      const planeT = (Math.sin(t * 0.45) * 0.5 + 0.5);
      const pp = flightCurve.getPoint(planeT);
      planeDot.position.copy(pp);
      planeTail.position.copy(pp);

      // Bali pulse animation
      const pulse = 1 + Math.sin(t * 2.8) * 0.35;
      baliPulse.scale.setScalar(pulse);
      baliPulseMat.opacity = Math.max(0, 0.25 - (pulse - 1) * 0.4);
      baliRing.scale.setScalar(1 + Math.sin(t * 1.4) * 0.08);

      // Arc opacity shimmer
      arcMat.opacity = 0.55 + Math.sin(t * 1.8) * 0.2;

      // Slow star drift
      starMat.opacity = 0.45 + Math.sin(t * 0.3) * 0.1;

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      mount.removeEventListener('mousedown', e => startDrag(e.clientX, e.clientY));
      window.removeEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="w-full h-full cursor-grab active:cursor-grabbing select-none"
    />
  );
}
