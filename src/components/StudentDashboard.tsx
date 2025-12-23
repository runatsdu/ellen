import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Play, Users, BookOpen, Tag as TagIcon, Calendar, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Session {
  id: string
  name: string
  description: string | null
  created_at: string
  expires_at: string | null
  teacher_email: string
  class_name: string
  course_name: string | null
  tags: Array<{
    id: string
    name: string
    color: string
  }>
  participant_count: number
  has_joined: boolean
}

interface StudentDashboardProps {
  user: any
  onSignOut: () => void
}

export default function StudentDashboard({ user, onSignOut }: StudentDashboardProps) {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>([])
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [user.email])

  const fetchData = async () => {
    try {
      // Fetch student's classes
      const { data: classesData, error: classesError } = await supabase
        .from('class_members')
        .select(`
          classes(
            id,
            name,
            description,
            created_at,
            teachers(email)
          )
        `)
        .eq('user_email', user.email)
console.log({classesData})
      if (classesError) {
        console.error('Error fetching classes:', classesError)
      } else {
        const studentClasses = (classesData || [])
          .filter(item => item.classes) // Filter out null classes
          .map(item => ({
            id: item.classes.id,
            name: item.classes.name,
            description: item.classes.description,
            created_at: item.classes.created_at,
            teacher_email: item.classes.teachers?.email || 'Unknown'
          }))
          .sort((a, b) => a.name.localeCompare(b.name))
        setClasses(studentClasses)
      }

      // Fetch active sessions for classes the student is in
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          name,
          description,
          created_at,
          expires_at,
          teachers!inner(email),
          classes!inner(name),
          courses(name),
          session_participants(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError)
        setError('Failed to load sessions')
        return
      }

      // Fetch tags and participation status for each session
      const sessionsWithDetails = await Promise.all((sessionsData || []).map(async (session) => {
        // Get tags for this session
        const { data: sessionTags } = await supabase
          .from('session_tags')
          .select(`
            tags (
              id,
              name,
              color
            )
          `)
          .eq('session_id', session.id)

        const tags = sessionTags?.map(st => st.tags).filter(Boolean) || []

        // Check if user has joined this session
        const { data: participation } = await supabase
          .from('session_participants')
          .select('id')
          .eq('session_id', session.id)
          .eq('user_email', user.email)
          .maybeSingle()

        return {
          id: session.id,
          name: session.name,
          description: session.description,
          created_at: session.created_at,
          expires_at: session.expires_at,
          teacher_email: session.teachers.email,
          class_name: session.classes.name,
          course_name: session.courses?.name || null,
          tags,
          participant_count: session.session_participants?.[0]?.count || 0,
          has_joined: !!participation
        }
      }))

      setSessions(sessionsWithDetails)
    } catch (error) {
      console.error('Error fetching sessions:', error)
      setError('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('session_participants')
        .insert([{
          session_id: sessionId,
          user_email: user.email
        }])

      if (error) {
        console.error('Error joining session:', error)
        return
      }

      // Navigate to session page
      navigate(`/session/${sessionId}`)
    } catch (error) {
      console.error('Error joining session:', error)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    onSignOut()
  }

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null
    
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`
    } else {
      return `${minutes}m remaining`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
                <p className="text-gray-600">Welcome back, {user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">My Classes</h3>
                <p className="text-2xl font-bold text-blue-600">{classes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
                <p className="text-2xl font-bold text-green-600">{sessions.filter(s => !isExpired(s.expires_at)).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sessions Joined</h3>
                <p className="text-2xl font-bold text-purple-600">{sessions.filter(s => s.has_joined).length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Classes */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">My Classes</h2>
            <p className="text-gray-600">Classes you're enrolled in</p>
          </div>

          <div className="p-6">
            {classes.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No classes yet</h3>
                <p className="text-gray-600">You haven't been enrolled in any classes yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">{cls.name}</h3>
                        {cls.description && (
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">{cls.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span><strong>Teacher:</strong> {cls.teacher_email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {new Date(cls.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Available Sessions</h2>
            <p className="text-gray-600">Join active learning sessions from your classes</p>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading sessions...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12">
                <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No active sessions</h3>
                <p className="text-gray-600">Check back later for new learning sessions from your teachers</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => {
                  const expired = isExpired(session.expires_at)
                  const timeRemaining = getTimeRemaining(session.expires_at)
                  
                  return (
                    <div
                      key={session.id}
                      className={`border rounded-lg p-6 transition-all duration-200 ${
                        expired 
                          ? 'border-gray-200 bg-gray-50 opacity-60' 
                          : 'border-gray-200 hover:shadow-md hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{session.name}</h3>
                            {session.has_joined && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Joined
                              </span>
                            )}
                            {expired && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Expired
                              </span>
                            )}
                          </div>
                          
                          {session.description && (
                            <p className="text-gray-600 mb-3">{session.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{session.class_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>{session.teacher_email}</span>
                            </div>
                            {session.course_name && (
                              <div className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                <span>{session.course_name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{session.participant_count} participant{session.participant_count !== 1 ? 's' : ''}</span>
                            </div>
                          </div>

                          {session.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {session.tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                                  style={{ backgroundColor: tag.color }}
                                >
                                  <TagIcon className="w-3 h-3" />
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Created {new Date(session.created_at).toLocaleDateString()}</span>
                            {timeRemaining && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span className={expired ? 'text-red-500' : 'text-orange-500'}>
                                  {timeRemaining}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-6">
                          {session.has_joined ? (
                            <button
                              onClick={() => navigate(`/session/${session.id}`)}
                              disabled={expired}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              <Play className="w-4 h-4" />
                              Continue
                            </button>
                          ) : (
                            <button
                              onClick={() => handleJoinSession(session.id)}
                              disabled={expired}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                              <Play className="w-4 h-4" />
                              Join Session
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}