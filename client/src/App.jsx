import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminSchoolDetailPage from './pages/AdminSchoolDetailPage';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import PrincipalDashboard from './pages/PrincipalDashboard';
import StudentProfile from './pages/StudentProfile';
import AddAchievement from './pages/AddAchievement';
import VerifyAchievement from './pages/VerifyAchievement';
import PublicVerifyPage from './pages/PublicVerifyPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import PageLoader from './components/shared/PageLoader';
import ProtectedRoute from './routes/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

const App = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/verify/:uid" element={<PublicVerifyPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/schools/:id"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSchoolDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/principal"
        element={
          <ProtectedRoute allowedRoles={['principal']}>
            <PrincipalDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/students/:uid"
        element={
          <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
            <StudentProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/achievements/add"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <AddAchievement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/achievements/verify"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <VerifyAchievement />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />
    </Routes>
  );
};

export default App;
