import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Property Rent Management
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Calendar and Appointment Scheduling System
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <Link
              href="/properties"
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              View Properties
            </Link>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900">Property Management</h3>
            <p className="mt-2 text-gray-500">
              Manage your properties and track their availability.
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900">Appointment Scheduling</h3>
            <p className="mt-2 text-gray-500">
              Book appointments with clients for property visits.
            </p>
          </div>
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900">Calendar Admin</h3>
            <p className="mt-2 text-gray-500">
              Admin panel to manage calendar availability and time slots.
            </p>
          </div>
        </div>
      </main>

      <footer className="bg-white mt-16">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400 text-sm">
            © 2024 RentHouse CalendMan. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
