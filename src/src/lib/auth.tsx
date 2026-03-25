'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';

export interface StaffProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  role: 'admin' | 'doctor' | 'assistant' | 'receptionist' | 'hygienist';
  specialization: string | null;
  location_id: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export interface Permission {
  resource: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface AuthState {
  user: User | null;
  staff: StaffProfile | null;
  permissions: Permission[];
  clinicId: string | null;
  locationId: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  can: (resource: string, action: 'view' | 'create' | 'edit' | 'delete') => boolean;
  isRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [state, setState] = useState<AuthState>({
    user: null,
    staff: null,
    permissions: [],
    clinicId: null,
    locationId: null,
    loading: true,
    error: null,
  });

  const loadProfile = useCallback(async (user: User) => {
    try {
      // Fetch staff profile
      const { data: staff, error: staffErr } = await supabase
        .from('staff')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (staffErr || !staff) {
        setState(prev => ({ ...prev, user, loading: false, error: 'Nincs aktív munkatárs profil.' }));
        return;
      }

      // Fetch permissions for role
      const { data: perms } = await supabase
        .from('role_permissions')
        .select('resource, can_view, can_create, can_edit, can_delete')
        .eq('role', staff.role);

      // Get clinic_id from location
      let clinicId: string | null = null;
      if (staff.location_id) {
        const { data: loc } = await supabase
          .from('locations')
          .select('clinic_id')
          .eq('id', staff.location_id)
          .single();
        clinicId = loc?.clinic_id || null;
      }

      setState({
        user,
        staff: staff as StaffProfile,
        permissions: (perms || []) as Permission[],
        clinicId,
        locationId: staff.location_id,
        loading: false,
        error: null,
      });
    } catch {
      setState(prev => ({ ...prev, user, loading: false, error: 'Profil betöltési hiba.' }));
    }
  }, [supabase]);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setState(prev => ({ ...prev, loading: false }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setState({
          user: null, staff: null, permissions: [], clinicId: null, locationId: null,
          loading: false, error: null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile, supabase]);

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setState(prev => ({ ...prev, loading: false, error: error.message }));
      return { error: error.message };
    }
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setState({
      user: null, staff: null, permissions: [], clinicId: null, locationId: null,
      loading: false, error: null,
    });
  };

  const can = (resource: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean => {
    const perm = state.permissions.find(p => p.resource === resource);
    if (!perm) return false;
    switch (action) {
      case 'view': return perm.can_view;
      case 'create': return perm.can_create;
      case 'edit': return perm.can_edit;
      case 'delete': return perm.can_delete;
      default: return false;
    }
  };

  const isRole = (...roles: string[]): boolean => {
    return state.staff ? roles.includes(state.staff.role) : false;
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, can, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function usePermission(resource: string) {
  const { can } = useAuth();
  return {
    canView: can(resource, 'view'),
    canCreate: can(resource, 'create'),
    canEdit: can(resource, 'edit'),
    canDelete: can(resource, 'delete'),
  };
}
