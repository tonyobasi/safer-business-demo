import { createContext, useContext, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
interface Session {
  contact: string;
  demo: true;
}
const SessionContext = createContext<{
  session: Session | null;
  login: (contact: string) => void;
  logout: () => void;
}>({ session: null, login: () => {}, logout: () => {} });
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, set] = useState<Session | null>(() => {
    try {
      return JSON.parse(sessionStorage.getItem('safer-demo-session') || 'null');
    } catch {
      return null;
    }
  });
  return (
    <SessionContext.Provider
      value={{
        session,
        login: (contact) => {
          const s = { contact, demo: true as const };
          sessionStorage.setItem('safer-demo-session', JSON.stringify(s));
          set(s);
        },
        logout: () => {
          sessionStorage.removeItem('safer-demo-session');
          sessionStorage.removeItem('safer-demo-chat');
          sessionStorage.removeItem('safer-onboarding');
          set(null);
        },
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
export const useSession = () => useContext(SessionContext);
export function RequireSession({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const loc = useLocation();
  return session ? children : <Navigate to="/login" state={{ from: loc.pathname }} replace />;
}
