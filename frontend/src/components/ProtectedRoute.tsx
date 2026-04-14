import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  role: 'contractor' | 'worker';
}

export default function ProtectedRoute({ children, role }: Props) {
  const raw = localStorage.getItem('kp_user');
  if (!raw) return <Navigate to={`/login?type=${role}`} replace />;

  try {
    const user = JSON.parse(raw);
    if (user.type !== role) {
      // Wrong role — send them to their correct page
      return <Navigate to={user.type === 'contractor' ? '/contractor' : '/worker'} replace />;
    }
  } catch {
    localStorage.removeItem('kp_user');
    return <Navigate to={`/login?type=${role}`} replace />;
  }

  return <>{children}</>;
}
