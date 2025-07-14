
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Gym, GymOwner } from '@/types/gym';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  gym: Gym | null;
  gymOwner: GymOwner | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, gymName: string, phone: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [gym, setGym] = useState<Gym | null>(null);
  const [gymOwner, setGymOwner] = useState<GymOwner | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGymData = async (userId: string) => {
    try {
      // Fetch gym owner data
      const { data: gymOwnerData, error: gymOwnerError } = await supabase
        .from('gym_owners')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (gymOwnerError || !gymOwnerData) {
        console.error('Error fetching gym owner:', gymOwnerError);
        return;
      }

      setGymOwner(gymOwnerData);

      // Fetch gym data
      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .select('*')
        .eq('id', gymOwnerData.gym_id)
        .single();

      if (gymError || !gymData) {
        console.error('Error fetching gym:', gymError);
        return;
      }

      setGym(gymData);
    } catch (error) {
      console.error('Error in fetchGymData:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer gym data fetching to prevent potential deadlocks
          setTimeout(() => {
            fetchGymData(session.user.id);
          }, 0);
        } else {
          setGym(null);
          setGymOwner(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchGymData(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, gymName: string, phone: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          gym_name: gymName,
          phone: phone,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setGym(null);
    setGymOwner(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      gym,
      gymOwner,
      loading,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
