import React from 'react';
import { useLocation } from 'react-router-dom';
import Earth3D from '../three/Earth3D';
import CursorWaves from '../three/CursorWaves';

const GlobalBackground = () => {
    const location = useLocation();
    const isLanding = location.pathname === '/';

    return (
        <>
            {/* Logic: Landing Page gets the Main 3D Earth. Other pages get the subtle Waves animation. */}
            {isLanding ? (
                <Earth3D />
            ) : (
                <CursorWaves />
            )}
        </>
    );
};

export default GlobalBackground;
