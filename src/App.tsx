import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { supabase } from './lib/supabase'
import AuthForm from './components/AuthForm'
import Dashboard from './components/Dashboard'
import TeacherDashboard from './components/TeacherDashboard'
import StudentDashboard from './components/StudentDashboard'
import CreateQuestion from './components/CreateQuestion'
import CreateClass from './components/CreateClass'
import CreateSession from './components/CreateSession'
import ClassDetail from './components/ClassDetail'
import SessionPage from './components/SessionPage'
import { useTeacher } from './hooks/useTeacher'
import { Loader2 } from 'lucide-react'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [fakeUser, setFakeUser] = useState<any>(null)
  const { teacher, loading: teacherLoading, isTeacher } = useTeacher(user?.email || fakeUser?.email)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null)
      })()
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleFakeLogin = (email: string) => {
    const mockUser = {
      id: `fake-${email}`,
      email: email,
      last_sign_in_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
    setFakeUser(mockUser)
  }

  const handleSignOut = async () => {
    if (user) {
      await supabase.auth.signOut()
    }
    setUser(null)
    setFakeUser(null)
  }

  if (loading || teacherLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const currentUser = user || fakeUser

  if (currentUser) {
    if (isTeacher && teacher) {
      return (
        <Routes>
          <Route path="/" element={<TeacherDashboard user={currentUser} teacher={teacher} onSignOut={handleSignOut} />} />
          <Route path="/create-question" element={<CreateQuestion teacher={teacher} />} />
          <Route path="/create-class" element={<CreateClass teacher={teacher} />} />
          <Route path="/create-session" element={<CreateSession teacher={teacher} />} />
          <Route path="/class/:classId" element={<ClassDetail teacher={teacher} />} />
          <Route path="/session/:sessionId" element={<SessionPage user={currentUser} />} />
        </Routes>
      )
    }
    return (
      <Routes>
        <Route path="/" element={<StudentDashboard user={currentUser} onSignOut={handleSignOut} />} />
        <Route path="/session/:sessionId" element={<SessionPage user={currentUser} />} />
      </Routes>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <AuthForm onSuccess={() => {}} onFakeLogin={handleFakeLogin} />
    </div>
  )
}

export default App