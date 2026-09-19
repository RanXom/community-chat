import AuthPage from './components/auth/AuthPage';
import ChatPage from './components/chat/ChatPage';
import { useAuth } from './hooks/useAuth';

function App() {
  const auth = useAuth();

  if (!auth.token) {
    return <AuthPage auth={auth} />;
  }

  return <ChatPage key={auth.token} auth={auth} />;
}

export default App;