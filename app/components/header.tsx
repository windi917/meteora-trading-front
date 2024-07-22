'use client';
import Link from 'next/link';
import Image from 'next/image';
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { getAddress } from "@/app/utiles";
import WalletInteraction from './WalletInteraction';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

function NavLink({ href, children }: NavLinkProps) {
  return (
    <Link href={href} passHref legacyBehavior>
      <a className="mx-2 hover:text-blue-500 active:text-blue-700 border-b-2 border-transparent hover:border-blue-500 active:border-blue-700">
        {children}
      </a>
    </Link>
  );
}

function Header() {
  return (
    <header className="w-full pl-10 p-4 text-white flex justify-between items-center flex-wrap md:flex-nowrap">
      <div className="flex items-center space-x-10 mb-4 md:mb-0">
        <div className="mr-4">
          <Image src="/logo.svg" alt="Logo" width={80} height={80} />
        </div>
        <nav className="space-x-10">
          <NavLink href="/vaults">VAULTS</NavLink>
          <NavLink href="/portfolio">PORTFOLIO</NavLink>
          <NavLink href="/dashboard">DASHBOARD</NavLink>
          <NavLink href="/about">ABOUT</NavLink>
        </nav>
      </div>

      <div className="header-buttons">
        <WalletInteraction/>
      </div>
    </header>
  );
}

export default Header;