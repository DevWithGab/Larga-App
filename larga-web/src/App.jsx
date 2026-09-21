import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import CommuterLayout from './components/CommuterLayout';
import SplashPage from './pages/SplashPage';
import RoleSelectionPage from './pages/RoleSelectionPage';
import CommuterLoginPage from './pages/CommuterLoginPage';
import CommuterSignUpPage from './pages/CommuterSignUpPage';
import DriverLoginPage from './pages/DriverLoginPage';
import DriverSignUpPage from './pages/DriverSignUpPage';
import DriverTripsPage from './pages/DriverTripsPage';
import MapPage from './pages/MapPage';
import RoutesPage from './pages/RoutesPage';
import SavedRoutesPage from './pages/SavedRoutesPage';
import AlertsPage from './pages/AlertsPage';
import ProfilePage from './pages/ProfilePage';


function LoadingScreen() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-white">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
    </div>
  );
}

export default function App() {
  const { user, userType, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<SplashPage />} />
        <Route path="/role" element={<RoleSelectionPage />} />
        <Route path="/login" element={<CommuterLoginPage />} />
        <Route path="/signup" element={<CommuterSignUpPage />} />
        <Route path="/driver" element={<DriverLoginPage />} />
        <Route path="/driver/signup" element={<DriverSignUpPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  if (userType === 'driver') {
    // Drivers get their trip history on the web and nothing else: reading past
    // trips works fine in a browser, but broadcasting a live position doesn't,
    // because the tab stops reporting once the phone locks.
    return (
      <Routes>
        <Route path="/trips" element={<DriverTripsPage />} />
        <Route path="*" element={<Navigate to="/trips" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<CommuterLayout />}>
        <Route path="/map" element={<MapPage />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/saved-routes" element={<SavedRoutesPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/map" replace />} />
    </Routes>
  );
}
