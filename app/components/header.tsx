'use client';
import Link from 'next/link';
import Image from 'next/image';
import WalletInteraction from './WalletInteraction';
import { JwtTokenContext } from '../Provider/JWTTokenProvider';
import { useContext, useState, useRef, useEffect } from 'react';
import { MeteoraContext } from '../Provider/MeteoraProvider';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void; // Add onClick prop to handle item click
}

const NavLink: React.FC<NavLinkProps> = ({ href, children, onClick }) => {
  return (
    <Link href={href} passHref legacyBehavior>
      <a
        className="block w-full px-4 py-2 text-sm text-white hover:text-blue-400 active:text-blue-600  transition-colors duration-200 text-center" // focus:outline-none focus:ring-2 focus:ring-blue-500
        onClick={onClick} // Handle item click
      >
        {children}
      </a>
    </Link>
  );
};

const Header: React.FC = () => {
  const { userRole } = useContext(JwtTokenContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State to handle menu visibility
  const menuRef = useRef<HTMLDivElement>(null); // Ref to detect clicks outside the menu
  const buttonRef = useRef<HTMLButtonElement>(null); // Ref for the toggle button
  const { totalSOL, totalUSDC } = useContext(MeteoraContext);

  // Function to handle clicking outside the dialog
  const handleClickOutside = (event: MouseEvent) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target as Node) &&
      buttonRef.current &&
      !buttonRef.current.contains(event.target as Node)
    ) {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    // Add event listener when component mounts
    document.addEventListener('mousedown', handleClickOutside);
    // Remove event listener when component unmounts
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to close menu when a link is clicked
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="w-full p-4 text-white flex justify-between items-center bg-[#231f20] sticky top-0 z-50">
      {/* Logo and Menu Toggle Button for Mobile */}
      <div className="flex items-center justify-between w-full md:w-auto">
        <div className="flex items-center">
          <Image src="/logo.svg" alt="Logo" width={50} height={50} className="mr-4" />
          {/* {userRole === "ADMIN" ? (
            <div className="flex flex-row">
              <span className="text-sm text-white">Total:</span>
              <span className="text-sm text-white">{totalUSDC.toFixed(2)}$({totalSOL.toFixed(2)}SOL)</span>
            </div>
          ) : (
            null
          )} */}
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          ref={buttonRef} // Attach ref to the button to detect outside clicks
          className="md:hidden text-white focus:outline-none"
          onClick={() => setIsMenuOpen((prev) => !prev)} // Correct toggle logic
          aria-label={isMenuOpen ? 'Close navigation menu' : 'Toggle navigation menu'}
          aria-expanded={isMenuOpen}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Navigation Links for Desktop */}
      <nav className="hidden md:flex items-center space-x-10">
        <NavLink href="/vaults">VAULTS</NavLink>
        {userRole === 'ADMIN' ? (
          <>
            <NavLink href="/dashboard">DASHBOARD</NavLink>
            <NavLink href="/portfolio">PORTFOLIO</NavLink>
          </>
        ) : null}
        <NavLink href="/about">ABOUT</NavLink>

        {/* Wallet Interaction for Desktop */}
        <div className="ml-4">
          <WalletInteraction />
        </div>
      </nav>

      {/* Dropdown Menu for Mobile */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute top-full right-0 w-64 bg-[#2e2a2b] p-4 rounded-lg shadow-lg md:hidden z-10"
        >
          <div className="flex flex-col items-center space-y-1"> {/* Center items in the menu */}
            <NavLink href="/vaults" onClick={closeMenu}>VAULTS</NavLink>
            {userRole === 'ADMIN' ? (
              <>
                <NavLink href="/dashboard" onClick={closeMenu}>DASHBOARD</NavLink>
                <NavLink href="/portfolio" onClick={closeMenu}>PORTFOLIO</NavLink>
              </>
            ) : null}
            <NavLink href="/about" onClick={closeMenu}>ABOUT</NavLink>

            {/* Wallet Interaction for Mobile */}
            <div className="mt-4 w-full"> {/* Ensure full width */}
              <WalletInteraction />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
