import { createContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [needsUsername, setNeedsUsername] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [inboxViewed, setInboxViewed] = useState(false)

  const fetchProfile = useCallback(async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    if (data && data.username === data.email.split('@')[0]) {
      setNeedsUsername(false)
    }
  }, [])

  const fetchUnreadCount = useCallback(async (userId) => {
    if (!userId) return
    
    const { data } = await supabase
      .from('conversations')
      .select('id')
      .or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)

    if (!data || data.length === 0) {
      setUnreadCount(0)
      return
    }

    const ids = data.map(c => c.id)
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact' })
      .in('conversation_id', ids)
      .eq('is_read', false)
      .neq('sender_id', userId)

    setUnreadCount(count || 0)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
        fetchUnreadCount(session.user.id)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
          fetchUnreadCount(session.user.id)
        } else {
          setProfile(null)
          setUnreadCount(0)
          setInboxViewed(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile, fetchUnreadCount])

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    return { data, error }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      needsUsername,
      setNeedsUsername,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      unreadCount,
      setUnreadCount,
      fetchUnreadCount,
      inboxViewed,
      setInboxViewed
    }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
