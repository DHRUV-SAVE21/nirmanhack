import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useThemeStore } from '../../store/themeStore';

const WaveShaderMaterial = {
    uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0.0, 1.0, 0.0) }, // Default Green
        uMouse: { value: new THREE.Vector2(0, 0) }, // Mouse position uniform
    },
    vertexShader: `
        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uMouse;

        void main() {
            vUv = uv;
            vec3 pos = position;

            // Base gentle wave
            float wave = sin(pos.x * 2.0 + uTime) * 0.2 + sin(pos.y * 2.0 + uTime * 0.5) * 0.2;
            
            // Cursor interaction using distance from vertex to mouse (mapped to UV space 0 to 1)
            // If mouse is near 0,0 (center), we need to map uMouse (-1 to 1) to world pos approximately
            
            // Since plane is large, we check simple distance
            float d = distance(uv, uMouse);
            
            // Create a "lift" or "ripple" where the mouse is
            float interaction = 1.0 - smoothstep(0.0, 0.3, d); // 0.3 radius
            
            // Combine: The closer the mouse, the higher the Z amplitude
            pos.z += wave + (interaction * 1.5); 

            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying vec2 vUv;
        uniform vec3 uColor;
        uniform float uTime;

        void main() {
            // Gradient opacity based on UV - fade edges
            float opacity = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
            opacity *= smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
            
            // Add subtle scanlines
            float scanline = sin(vUv.y * 50.0 + uTime * 2.0);
            
            vec3 finalColor = uColor + (scanline * 0.1);

            gl_FragColor = vec4(finalColor, 0.3 * opacity); // Low opacity for premium look
        }
    `
};

const InteractiveWave = () => {
    const meshRef = useRef();
    const { mouse, camera, raycaster } = useThree();
    const theme = useThemeStore((state) => state.theme);

    // Dynamic Color
    const waveColor = theme === 'dark' ? new THREE.Color("#4ade80") : new THREE.Color("#15803d");

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: waveColor },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) }
    }), [theme]);

    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (meshRef.current) {
            // 1. Update Time
            meshRef.current.material.uniforms.uTime.value = t;
            meshRef.current.material.uniforms.uColor.value = waveColor;

            // 2. Accurate Raycasting for Cursor Interaction
            raycaster.setFromCamera(mouse, camera);
            // Use an invisible plane or the mesh itself. 
            // Note: Raycasting directly on a highly displaced mesh can be jittery, 
            // but for this effect on a large plane, it works reasonably well.
            const intersects = raycaster.intersectObject(meshRef.current);

            if (intersects.length > 0) {
                const { x, y } = intersects[0].uv;
                meshRef.current.material.uniforms.uMouse.value.set(x, y);
            }
        }
    });

    return (
        // Position lowered to -9 to be "less from the top"
        // Scale increased to 100 to cover the infinite horizon
        <mesh ref={meshRef} rotation={[-Math.PI / 2.2, 0, 0]} position={[0, -9, -20]}>
            <planeGeometry args={[100, 60, 128, 128]} />
            <shaderMaterial
                args={[WaveShaderMaterial]}
                uniforms={uniforms}
                transparent={true}
                wireframe={true}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

const CursorWaves = () => {
    const theme = useThemeStore((state) => state.theme);

    return (
        <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none transition-colors duration-1000">
            {/* Background Gradient */}
            <div className={`absolute inset-0 transition-colors duration-1000 ${theme === 'dark' ? 'bg-gradient-to-b from-dark-navy to-black' : 'bg-gradient-to-b from-green-50 via-white to-white'}`} />

            <Canvas camera={{ position: [0, 0, 15], fov: 60 }} dpr={[1, 2]}>
                <InteractiveWave />
            </Canvas>
        </div>
    );
};

export default CursorWaves;
