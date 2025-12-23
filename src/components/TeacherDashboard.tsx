import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, User, Plus, BookOpen, Calendar, Filter, X, Users, Play } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Teacher } from '../hooks/useTeacher'

interface Question {
  id: string
  title: string
  content: string
  course_id: string
  image_url: string | null
  image_filename: string | null
  created_at: string
  course?: {
    id: string
    name: string
    description: string | null
  }
  tags?: Array<{
    id: string
    name: string
    color: string
  }>
}

interface Course {
  id: string
  name: string
  description: string | null
}

interface Tag {
  id: string
  name: string
  color: string
}

interface Class {
  id: string
  name: string
  description: string | null
  created_at: string
  member_count?: number
}

interface Session {
  id: string
  name: string
  description: string | null
  created_at: string
  expires_at: string | null
  is_active: boolean
  class_name: string
  course_name: string | null
  participant_count: number
}

interface TeacherDashboardProps {
  user: any
  teacher: Teacher
  onSignOut: () => void
}

export default function TeacherDashboard({ user, teacher, onSignOut }: TeacherDashboardProps) {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState<Question[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchData()
  }, [teacher.id])

  useEffect(() => {
    filterQuestions()
  }, [questions, selectedCourse, selectedTags])

  const fetchData = async () => {
    try {
      // Fetch sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select(`
          id,
          name,
          description,
          created_at,
          expires_at,
          is_active,
          classes!inner(name),
          courses(name),
          session_participants(count)
        `)
        .eq('teacher_id', teacher.id)
        .order('created_at', { ascending: false })

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError)
      } else {
        const sessionsWithDetails = (sessionsData || []).map(session => ({
          id: session.id,
          name: session.name,
          description: session.description,
          created_at: session.created_at,
          expires_at: session.expires_at,
          is_active: session.is_active,
          class_name: session.classes.name,
          course_name: session.courses?.name || null,
          participant_count: session.session_participants?.[0]?.count || 0
        }))
        setSessions(sessionsWithDetails)
      }

      // Fetch classes with member counts
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select(`
          id,
          name,
          description,
          created_at,
          class_members(count)
        `)
        .eq('teacher_id', teacher.id)
        .order('created_at', { ascending: false })

      if (classesError) {
        console.error('Error fetching classes:', classesError)
      } else {
        const classesWithCounts = (classesData || []).map(cls => ({
          ...cls,
          member_count: cls.class_members?.[0]?.count || 0
        }))
        setClasses(classesWithCounts)
      }

      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, name, description')

      if (coursesError) {
        console.error('Error fetching courses:', coursesError)
        return
      }

      setCourses(coursesData || [])

      // Fetch tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('id, name, color')
        .order('name')

      if (tagsError) {
        console.error('Error fetching tags:', tagsError)
      } else {
        setTags(tagsData || [])
      }

      // Create a map of courses for quick lookup
      const coursesMap = new Map(coursesData?.map(course => [course.id, course]) || [])

      // Fetch questions
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('teacher_id', teacher.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching questions:', error)
      } else {
        // Fetch tags for each question
        const questionsWithData = await Promise.all((data || []).map(async (question) => {
          // Get tags for this question
          const { data: questionTags } = await supabase
            .from('question_tags')
            .select(`
              tags (
                id,
                name,
                color
              )
            `)
            .eq('question_id', question.id)

          const tags = questionTags?.map(qt => qt.tags).filter(Boolean) || []

          return {
            ...question,
            course: question.course_id ? coursesMap.get(question.course_id) : null,
            tags
          }
        }))

        setQuestions(questionsWithData)
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterQuestions = () => {
    let filtered = [...questions]

    // Filter by course
    if (selectedCourse) {
      filtered = filtered.filter(question => question.course_id === selectedCourse)
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter(question => 
        question.tags && question.tags.some(tag => selectedTags.includes(tag.id))
      )
    }

    setFilteredQuestions(filtered)
  }

  const clearFilters = () => {
    setSelectedCourse('')
    setSelectedTags([])
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    onSignOut()
  }

  // Refresh data when returning to dashboard
  useEffect(() => {
    const handleFocus = () => {
      fetchData()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
                <p className="text-gray-600">Welcome back, {teacher.email}</p>
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

        {/* Quick Actions */}
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <button
            onClick={() => navigate('/create-question')}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create Question</h3>
                <p className="text-gray-600 text-sm">Add a new question</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/create-class')}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create Class</h3>
                <p className="text-gray-600 text-sm">Add a new class</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate('/create-session')}
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-200 text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create Session</h3>
                <p className="text-gray-600 text-sm">Start a learning session</p>
              </div>
            </div>
          </button>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Questions</h3>
                <p className="text-2xl font-bold text-blue-600">{questions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Classes</h3>
                <p className="text-2xl font-bold text-orange-600">{classes.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
                <p className="text-2xl font-bold text-purple-600">{sessions.filter(s => s.is_active).length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Member Since</h3>
                <p className="text-sm text-gray-600">{new Date(teacher.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        {sessions.filter(s => s.is_active).length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Active Sessions</h2>
              <p className="text-gray-600">{sessions.filter(s => s.is_active).length} active session{sessions.filter(s => s.is_active).length !== 1 ? 's' : ''}</p>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sessions.filter(s => s.is_active).map((session) => (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                    onClick={() => navigate(`/session/${session.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{session.name}</h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    {session.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{session.description}</p>
                    )}
                    <div className="space-y-1 text-xs text-gray-500">
                      <p><strong>Class:</strong> {session.class_name}</p>
                      {session.course_name && (
                        <p><strong>Course:</strong> {session.course_name}</p>
                      )}
                      <p><strong>Participants:</strong> {session.participant_count}</p>
                      <p>Created {new Date(session.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Classes List */}
        {classes.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Your Classes</h2>
              <p className="text-gray-600">{classes.length} class{classes.length !== 1 ? 'es' : ''}</p>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                    onClick={() => navigate(`/class/${cls.id}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {cls.member_count} student{cls.member_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {cls.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{cls.description}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      Created {new Date(cls.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Questions List */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Your Questions</h2>
                <p className="text-gray-600">
                  {filteredQuestions.length} of {questions.length} questions
                  {(selectedCourse || selectedTags.length > 0) && ' (filtered)'}
                </p>
              </div>
              {(selectedCourse || selectedTags.length > 0) && (
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {(selectedCourse ? 1 : 0) + selectedTags.length} filter{((selectedCourse ? 1 : 0) + selectedTags.length) !== 1 ? 's' : ''} active
                  </span>
                </div>
              )}
            </div>

            {/* Filters Panel - Always Visible */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Course Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Course
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="">All courses</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Tags
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                          selectedTags.includes(tag.id)
                            ? 'text-white shadow-md'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                        style={selectedTags.includes(tag.id) ? { backgroundColor: tag.color } : {}}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              {(selectedCourse || selectedTags.length > 0) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading questions...</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              questions.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first question</p>
                <button
                  onClick={() => navigate('/create-question')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Create Question
                </button>
              </div>
              ) : (
                <div className="text-center py-12">
                  <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No questions match your filters</h3>
                  <p className="text-gray-600 mb-4">Try adjusting your filter criteria</p>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                    Clear filters
                  </button>
                </div>
              )
            ) : (
              <div className="space-y-4">
                {filteredQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start gap-4">
                      {question.image_url && (
                        <div className="flex-shrink-0">
                          <img
                            src={question.image_url}
                            alt="Question image"
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-2">{question.title}</h3>
                        {question.course && (
                          <div className="mb-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                              {question.course.name}
                            </span>
                          </div>
                        )}
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{question.content}</p>
                        {question.tags && question.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {question.tags.map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: tag.color }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Created {new Date(question.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}