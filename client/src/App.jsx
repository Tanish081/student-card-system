import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import PrincipalDashboard from './pages/PrincipalDashboard';
import StudentProfile from './pages/StudentProfile';
import AddAchievement from './pages/AddAchievement';
import VerifyAchievement from './pages/VerifyAchievement';
import ProtectedRoute from './routes/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

const App = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
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
        element={
          user ? (
            <Navigate to={`/${user.role}`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

export default App;
