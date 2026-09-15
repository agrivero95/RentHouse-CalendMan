import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-xl font-bold text-blue-600">
            RentHouse CalendMan
          </Link>
          <div className="flex space-x-4">
            <Link href="/properties" className="text-gray-700 hover:text-blue-600">
              Properties
            </Link>
            <Link href="/login" className="text-gray-700 hover:text-blue-600">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
