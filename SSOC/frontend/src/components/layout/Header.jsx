import React from 'react';
import { useNavigate } from 'react-router-dom';
import LogoLogo from '../../assets/LOGO_logo.png';
import LogoName from '../../assets/LOGO_name.png';

const Header = () => {
    const navigate = useNavigate();

    return (
        <header className="fixed top-0 left-20 right-0 h-16 bg-[#F8FAF9]/80 backdrop-blur-md z-[90] flex items-center justify-center px-8 transition-all duration-300">
            <div
                className="flex items-center gap-1 cursor-pointer"
                onClick={() => navigate('/app')}
            >
                <img src={LogoLogo} alt="SSOC Logo" className="h-12 w-auto object-contain" />
                <img src={LogoName} alt="SSOC Name" className="h-8 w-auto object-contain mt-1" />
            </div>
        </header>
    );
};

export default Header;
