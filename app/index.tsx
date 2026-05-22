import { AuthProvider } from '../src/context/AuthContext';
import { LoginScreen } from './screens/LoginScreen';

export default function Index() {
  return (
    <AuthProvider>
      <LoginScreen />
    </AuthProvider>
  );
}
