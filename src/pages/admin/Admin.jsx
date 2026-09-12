/**
 * Admin Dashboard Component
 * 
 * This component serves as the main administrative interface for the photography/videography business.
 * It provides a centralized dashboard with multiple sections for managing different aspects of the business:
 * 
 * - Analytics: View business metrics and charts
 * - Calendar: Manage booking schedules and appointments
 * - Admin Accounts: Control user access and manage administrator accounts
 * - Profile Management: Update personal admin information
 * - Pending Bookings: Review and approve/reject booking requests
 * 
 * The component features a responsive design with a collapsible sidebar navigation, a fixed header
 * with user profile information, and a dynamic content area that renders different admin sections
 * based on user selection. It also handles authentication checking and profile data fetching.
 * 
 * This is a protected route component that should only be accessible to authenticated administrators.
 */

import { useState, useEffect } from 'react'; // Import React hooks for state management and side effects
import { Link, Routes, Route, useNavigate } from 'react-router-dom'; // Import routing components from React Router
import CalendarSection from '../../admin_sections/CalendarSection'; // Import calendar management component
import AdminAccountsSection from '../../admin_sections/AdminAccountsSection'; // Import admin user management component
import YourProfileSection from '../../admin_sections/YourProfileSection'; // Import profile management component
import AdminService from '../../components/service/AdminService'; // Import admin authentication service
import PendingBookings from '../../admin_sections/PendingBookings'; // Import pending bookings management component
import DataAnalytics from '../../admin_sections/DataAnalytics'; // Import analytics dashboard component
import ContentSection from '../../admin_sections/ContentSection'; // Import CMS content management component
import { useConfirm } from '../../components/common/ConfirmDialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Import FontAwesome icon component
import {
  faBars, faCalendar, faCircleUser, faSignOut, faUser,
  faUserAlt, faUserCheck, faUserClock, faUserEdit,
  faUserFriends, faUserGear, faChartLine, faImages
} from '@fortawesome/free-solid-svg-icons'; // Import specific icons from FontAwesome


function Admin() {
  const confirm = useConfirm();
  const navigate = useNavigate();
  // State to control sidebar navigation visibility (default is open)
  const [isNavOpen, setIsNavOpen] = useState(true);
  // State to track which dashboard section is currently active (default is analytics)
  const [currentSection, setCurrentSection] = useState('analytics');

  // Check if user is authenticated and has admin role using AdminService
  const isAuthenticated = AdminService.isAuthenticated();
  const isAdmin = AdminService.isAdmin();

  // State to store the admin's profile information with a default name
  const [adminProfile, setAdminProfile] = useState({ name: 'Admin' });

  // Effect hook that runs once when component mounts to fetch admin profile data
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        // Get authentication token from browser storage
        const token = localStorage.getItem('token');
        if (token) {
          // Call API service to get current admin's profile info
          const response = await AdminService.getYourProfile(token);
          console.log('Admin profile response:', response); // Log response for debugging
          // Update state with profile data if available
          if (response && response.ourUsers) {
            setAdminProfile(response.ourUsers);
          }
        }
      } catch (error) {
        // Log any errors that occur during profile fetching
        console.error('Error fetching admin profile:', error);
      }
    };

    // Execute the profile fetching function
    fetchAdminProfile();
  }, []); // Empty dependency array means this effect runs only once after initial render
  
  // Handler function for logging out
  const handleLogout = async (e) => {
    // Confirm before ending the session; the link navigates away either way,
    // so cancel must prevent the default navigation too.
    e?.preventDefault();
    const ok = await confirm({
      title: 'Log out?',
      body: "You'll need to sign in again to manage bookings and content.",
      confirmLabel: 'Log out',
    });
    if (ok) {
      AdminService.logout();
      navigate('/');
    }
  };

  // Function to toggle sidebar navigation visibility
  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  // Nav items driven from a single list instead of repeated near-identical JSX,
  // so active/hover/icon styling stays consistent across every entry.
  const navItems = [
    { key: 'analytics', label: 'Analytics', icon: faChartLine },
    { key: 'calendar', label: 'Calendar', icon: faCalendar },
    { key: 'accounts', label: 'Admin Accounts', icon: faUserFriends },
    { key: 'profile', label: 'Your Profile', icon: faUserGear },
    { key: 'pendingBookings', label: 'Pending Bookings', icon: faUserClock },
    { key: 'content', label: 'Content', icon: faImages },
  ];

  // Main component render
  return (
    // Main container with dark background
    <div className="min-h-screen bg-gray-900">

      {/* Fixed header with dashboard title and user profile */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-white/5 px-4 sm:px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Left side with hamburger menu and dashboard title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleNav}
              aria-label="Toggle navigation"
              className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-300 hover:text-white hover:bg-white/5 transition-colors duration-150 hover:cursor-pointer"
            >
              <FontAwesomeIcon icon={faBars} className='text-lg'/>
            </button>
            <h1 className="text-xl sm:text-2xl text-white font-semibold tracking-tight">Admin Dashboard</h1>
          </div>
          {/* Right side with user profile avatar and name - clicking navigates to profile section */}
          <Link
            to="#"
            className="flex items-center space-x-2.5 pl-1 pr-3 py-1 rounded-full hover:bg-white/5 transition-colors duration-150"
            onClick={() => setCurrentSection('profile')}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
              <span className="text-white text-sm font-semibold">
                {/* Display first letter of admin name as avatar, or 'A' if name not available */}
                {adminProfile && adminProfile.name ? adminProfile.name[0]?.toUpperCase() : 'A'}
              </span>
            </div>
            {/* Display admin name or 'Admin' if name not available */}
            <h2 className="text-white text-sm font-medium hidden sm:block">{adminProfile && adminProfile.name ? adminProfile.name : 'Admin'}</h2>
          </Link>
        </div>
      </header>

      {/* Main content area with sidebar and dynamic content */}
      <div className="flex">
        {/* Collapsible sidebar navigation with slide animation */}
        <nav
          className={`fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-white/5 transform transition-transform duration-300 ease-out ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
          style={{ paddingTop: '88px' }}
        >
          <div className="flex flex-col h-full px-3 pb-4">
            <div className="flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive = currentSection === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setCurrentSection(item.key)}
                    className={`group relative flex w-full items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 hover:cursor-pointer ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={item.icon}
                      className={`text-base w-5 transition-colors duration-150 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-purple-400'}`}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Logout button - navigates to home page and triggers logout */}
            <Link to="/" onClick={handleLogout}>
              <button className="group flex w-full items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 hover:cursor-pointer">
                <FontAwesomeIcon icon={faSignOut} className='text-base w-5 text-gray-500 group-hover:text-red-400 transition-colors duration-150'/>
                <span>Log out</span>
              </button>
            </Link>
          </div>
        </nav>

        {/* Main content area - adjusts margin based on sidebar visibility */}
        <main className={`flex-1 px-4 sm:px-6 pt-24 pb-10 transition-all duration-300 ${isNavOpen ? 'md:ml-64' : ''}`}>
          {/* Conditional rendering based on which section is active */}
          {currentSection === 'analytics' && <DataAnalytics />}
          {currentSection === 'calendar' && <CalendarSection />}
          {currentSection === 'accounts' && <AdminAccountsSection />}
          {currentSection === 'profile' && <YourProfileSection />}
          {currentSection === 'pendingBookings' && <PendingBookings />}
          {currentSection === 'content' && <ContentSection />}
        </main>
      </div>
    </div>
  );
}

export default Admin; // Export the component for use in the application