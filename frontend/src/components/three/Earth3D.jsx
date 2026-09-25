import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useThemeStore } from '../../store/themeStore';

const Globe = React.memo(() => {
    const earthRef = useRef();
    const cloudsRef = useRef();
    const theme = useThemeStore((state) => state.theme);

    const materialProps = useMemo(() => ({
        earth: {
            color: theme === 'dark' ? "#1e40af" : "#38bdf8",
            roughness: theme === 'dark' ? 0.7 : 0.5,
            metalness: theme === 'dark' ? 0.5 : 0.2,
            emissive: theme === 'dark' ? "#111827" : "#0ea5e9",
            emissiveIntensity: theme === 'dark' ? 0.2 : 0.1
        },
        clouds: {
            color: theme === 'dark' ? "#4ade80" : "#ffffff",
            opacity: theme === 'dark' ? 0.15 : 0.4
        },
        atmosphere: {
            color: theme === 'dark' ? "#4ade80" : "#7dd3fc",
            opacity: theme === 'dark' ? 0.05 : 0.1
        }
    }), [theme]);

    useFrame(({ clock }) => {
        const elapsedTime = clock.getElapsedTime();
        if (earthRef.current) {
            earthRef.current.rotation.y = elapsedTime * 0.05;
        }
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y = elapsedTime * 0.07;
            cloudsRef.current.rotation.x = Math.sin(elapsedTime * 0.1) * 0.05;
        }
    });

    return (
        <group>
            {/* Core Earth Sphere */}
            <Sphere ref={earthRef} args={[2.8, 64, 64]} position={[0, 0, 0]}>
                <meshStandardMaterial {...materialProps.earth} />
            </Sphere>

            {/* Stylized Clouds / Network Layer */}
            <Sphere ref={cloudsRef} args={[2.85, 64, 64]}>
                <meshStandardMaterial
                    color={materialProps.clouds.color}
                    roughness={0.2}
                    metalness={0.1}
                    transparent
                    opacity={materialProps.clouds.opacity}
                    wireframe
                />
            </Sphere>

            {/* Atmosphere Glow */}
            <Sphere args={[3.2, 32, 32]} position={[0, 0, -1]}>
                <MeshDistortMaterial
                    color={materialProps.atmosphere.color}
                    attach="material"
                    distort={0.4}
                    speed={2}
                    roughness={0}
                    transparent
                    opacity={materialProps.atmosphere.opacity}
                    side={THREE.BackSide}
                />
            </Sphere>
        </group>
    );
});

Globe.displayName = 'Globe';

const Earth3D = () => {
    const theme = useThemeStore((state) => state.theme);

    const canvasProps = useMemo(() => ({
        dpr: [1, Math.min(window.devicePixelRatio, 2)] // Limit DPR for performance
    }), []);

    const lightProps = useMemo(() => ({
        ambient: { intensity: theme === 'dark' ? 0.5 : 0.8 },
        point1: { 
            position: [10, 10, 10], 
            intensity: 1.5, 
            color: theme === 'dark' ? "#38bdf8" : "#fdba74" 
        },
        point2: { 
            position: [-10, -10, -10], 
            intensity: 0.5, 
            color: "#22c55e" 
        }
    }), [theme]);

    return (
        <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none transition-colors duration-1000">
            {/* Background Gradient */}
            <div className={`absolute inset-0 transition-colors duration-1000 ${theme === 'dark' ? 'bg-gradient-to-b from-dark-navy to-black' : 'bg-gradient-to-b from-sky-50 via-white to-white'}`} />

            <Canvas {...canvasProps}>
                <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />

                <ambientLight intensity={lightProps.ambient.intensity} />
                <pointLight 
                    position={lightProps.point1.position} 
                    intensity={lightProps.point1.intensity} 
                    color={lightProps.point1.color} 
                />
                <pointLight 
                    position={lightProps.point2.position} 
                    intensity={lightProps.point2.intensity} 
                    color={lightProps.point2.color} 
                />

                {/* Stars only in Dark Mode */}
                {theme === 'dark' && (
                    <Stars radius={300} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                )}

                <Globe />

                {theme === 'dark' && <fog attach="fog" args={['#020617', 5, 25]} />}
            </Canvas>
        </div>
    );
};

export default Earth3D;
