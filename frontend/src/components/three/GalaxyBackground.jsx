import React, { useEffect, useRef } from 'react';
import { Renderer, Camera, Transform, Geometry, Program, Mesh, Color, Vec3 } from 'ogl';
import { useThemeStore } from '../../store/themeStore';

const GalaxyBackground = () => {
    const containerRef = useRef();
    const theme = useThemeStore((state) => state.theme);

    useEffect(() => {
        if (!containerRef.current) return;

        const renderer = new Renderer({ alpha: true, dpr: 2 });
        const gl = renderer.gl;
        containerRef.current.appendChild(gl.canvas);

        const camera = new Camera(gl, { fov: 45 });
        camera.position.set(0, 0, 8);

        const scene = new Transform();

        // Galaxy Particles
        const count = 25000;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);

        const colorInside = new Color(theme === 'dark' ? '#4ade80' : '#38bdf8'); // Bright Green / Sky Blue
        const colorOutside = new Color(theme === 'dark' ? '#064e3b' : '#1e40af'); // Deep Forest / Navy

        const branches = 3;
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;

            // Position
            const radius = Math.random() * 10;
            const spinAngle = radius * 1.5;
            const branchAngle = ((i % branches) / branches) * Math.PI * 2;

            const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.4 * radius;
            const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.4 * radius;
            const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 0.4 * radius;

            positions[i3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
            positions[i3 + 1] = randomY;
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

            // Color Interpolation
            const t = radius / 10;
            colors[i3 + 0] = colorInside[0] * (1 - t) + colorOutside[0] * t;
            colors[i3 + 1] = colorInside[1] * (1 - t) + colorOutside[1] * t;
            colors[i3 + 2] = colorInside[2] * (1 - t) + colorOutside[2] * t;

            // Size
            sizes[i] = Math.random() * 1.5 + 0.5;
        }

        const geometry = new Geometry(gl, {
            position: { size: 3, data: positions },
            color: { size: 3, data: colors },
            size: { size: 1, data: sizes },
        });

        const program = new Program(gl, {
            vertex: `
                attribute vec3 position;
                attribute vec3 color;
                attribute float size;

                uniform mat4 modelViewMatrix;
                uniform mat4 projectionMatrix;
                uniform float uTime;

                varying vec3 vColor;

                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Simple rotation
                    float angle = uTime * 0.1;
                    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
                    // mvPosition.xz *= rot;

                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                }
            `,
            fragment: `
                precision highp float;
                varying vec3 vColor;

                void main() {
                    float dist = distance(gl_PointCoord, vec2(0.5));
                    if (dist > 0.5) discard;
                    
                    float alpha = 1.0 - (dist * 2.0);
                    gl_FragColor = vec4(vColor, alpha * 0.8);
                }
            `,
            uniforms: {
                uTime: { value: 0 },
            },
            transparent: true,
            depthTest: false,
        });

        const mesh = new Mesh(gl, { mode: gl.POINTS, geometry, program });
        mesh.setParent(scene);

        let request;
        const update = (time) => {
            request = requestAnimationFrame(update);
            mesh.rotation.y = time * 0.0001;
            mesh.rotation.z = time * 0.00005;
            program.uniforms.uTime.value = time * 0.001;

            renderer.render({ scene, camera });
        };
        request = requestAnimationFrame(update);

        const handleResize = () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            cancelAnimationFrame(request);
            window.removeEventListener('resize', handleResize);
            if (gl.canvas.parentNode) {
                gl.canvas.parentNode.removeChild(gl.canvas);
            }
        };
    }, [theme]);

    return (
        <div
            ref={containerRef}
            className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none transition-opacity duration-1000"
            style={{ opacity: theme === 'dark' ? 1 : 0.6 }}
        />
    );
};

export default GalaxyBackground;
