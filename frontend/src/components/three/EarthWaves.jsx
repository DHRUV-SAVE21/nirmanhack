import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useThemeStore } from '../../store/themeStore';

const Terrain = ({ mode = 'hero' }) => {
    const mesh = useRef();
    const theme = useThemeStore((state) => state.theme);

    // Create a grid of points
    const { originalPositions } = useMemo(() => {
        const geometry = new THREE.PlaneGeometry(40, 20, 80, 40); // Larger grid
        const positions = geometry.attributes.position.array;
        const originalPositions = new Float32Array(positions.length);

        for (let i = 0; i < positions.length; i++) {
            originalPositions[i] = positions[i];
        }

        return { originalPositions };
    }, []);

    useFrame(({ mouse, clock }) => {
        if (!mesh.current) return;

        const time = clock.getElapsedTime();
        const positions = mesh.current.geometry.attributes.position.array;

        // Map normalized mouse (-1 to 1) to world space (approx -20 to 20)
        // Corrected sensitivity for accurate tracking
        const mouseX = mouse.x * 20;
        const mouseY = mouse.y * 10;

        for (let i = 0; i < positions.length; i += 3) {
            const x = originalPositions[i];
            const y = originalPositions[i + 1];

            const dx = x - mouseX;
            const dy = y - mouseY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Interaction Wave (Stronger and wider radius)
            const interactionIntensity = mode === 'hero' ? 2.5 : 1.2;
            const influenceRadius = mode === 'hero' ? 8 : 4;

            const mouseWave = Math.max(0, (influenceRadius - dist) / influenceRadius) *
                Math.sin(time * 2 - dist) * interactionIntensity;

            // Ambient Wave
            const ambientIntensity = mode === 'hero' ? 0.35 : 0.15;
            const ambientWave = Math.sin(x * 0.3 + time * 0.5) * ambientIntensity +
                Math.cos(y * 0.2 + time * 0.4) * ambientIntensity;

            positions[i + 2] = originalPositions[i + 2] + mouseWave + ambientWave;
        }

        mesh.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <mesh ref={mesh} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -4, 0]}>
            <planeGeometry args={[50, 30, 60, 40]} />
            <meshStandardMaterial
                wireframe
                // Dark Mode: Neon Green. Light Mode: Dark Green (Standard Green-700).
                color={theme === 'dark' ? '#22c55e' : '#15803d'}
                emissive={theme === 'dark' ? '#00ff9d' : '#166534'}
                emissiveIntensity={theme === 'dark' ? (mode === 'hero' ? 0.6 : 0.2) : 0}
                transparent
                opacity={theme === 'dark' ? 0.6 : 0.8}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

const EarthWaves = ({ mode = 'hero' }) => {
    const theme = useThemeStore((state) => state.theme);

    return (
        <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none transition-colors duration-1000">
            {/* Cleaner Light Mode Background */}
            <div className={`absolute inset-0 transition-colors duration-1000 ${theme === 'dark' ? 'bg-gradient-to-b from-dark-navy to-black' : 'bg-gradient-to-b from-sky-50 via-white to-white'}`} />
            <Canvas dpr={[1, 2]}>
                <PerspectiveCamera makeDefault position={[0, 4, 12]} fov={50} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#38bdf8" />
                <Terrain mode={mode} />
                {theme === 'dark' && <fog attach="fog" args={['#020617', 5, 25]} />}
            </Canvas>
        </div>
    );
};

export default EarthWaves;
