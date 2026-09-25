import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { useThemeStore } from '../../store/themeStore';

const CustomCursor = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const theme = useThemeStore((state) => state.theme);

    // Smooth spring animation for the follower
    const springConfig = { damping: 25, stiffness: 700 };
    const cursorX = useSpring(mouseX, springConfig);
    const cursorY = useSpring(mouseY, springConfig);

    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const moveCursor = (e) => {
            mouseX.set(e.clientX - 16); // Center offset (32px / 2)
            mouseY.set(e.clientY - 16);
        };

        const handleMouseOver = (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.tagName === 'A' || e.target.closest('.cursor-pointer')) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleMouseOver);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleMouseOver);
        };
    }, [mouseX, mouseY]);

    // Don't render on mobile / touch devices usually, but for now just CSS hide
    return (
        <motion.div
            className={`fixed top-0 left-0 w-8 h-8 rounded-full border-2 pointer-events-none z-[9999] hidden md:block
                ${theme === 'dark' ? 'border-organic-green' : 'border-dark-navy'}
            `}
            style={{
                x: cursorX,
                y: cursorY,
                scale: isHovering ? 1.5 : 1,
            }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
        >
            {/* Center Dot */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full 
                ${theme === 'dark' ? 'bg-organic-green' : 'bg-dark-navy'}
            `} />
        </motion.div>
    );
};

export default CustomCursor;
