export interface UserSession {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | undefined;
  imageUrl: string;
  role: string;
}

export interface SessionState {
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
}