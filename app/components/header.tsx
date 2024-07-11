import Link from 'next/link';
import Image from 'next/image';
import WalletInteraction from "../Provider/WalletInteraction";

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
          <NavLink href="/about">ABOUT</NavLink>
        </nav>
        <WalletInteraction/>
      </div>
    </header>
  );
}

export default Header;