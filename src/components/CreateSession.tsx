import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Play, Users, BookOpen, Tag as TagIcon, Calendar, X, FileText, Search, Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Teacher } from '../hooks/useTeacher'

interface Course {
  id: string
  name: string
  description: string | null
}

interface Tag {
  id: string
  name: string
  description: string | null
  color: string
}

interface Question {
  id: string
  title: string
  content: string
  course_id: string
  image_url: string | null
  created_at: string
  course?: {
    name: string
  }
  tags?: Array<{
    id: string
    name: string
    color: string
  }>
}

interface Class {
  id: string
  name: string
  description: string | null
}

interface CreateSessionProps {
  teacher: Teacher
}

export default function CreateSession({ teacher }: CreateSessionProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [classId, setClassId] = useState('')
  const [courseId, setCourseId] = useState('')
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [expiresAt, setExpiresAt] = useState('')
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([])
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([])
  const [questionSearchTerm, setQuestionSearchTerm] = useState('')
  const [showQuestionSelector, setShowQuestionSelector] = useState(false)
  const [classes, setClasses] = useState<Class[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (courseId || selectedTags.length > 0) {
      fetchQuestions()
    } else {
      setAvailableQuestions([])
      setSelectedQuestions([])
    }
  }, [courseId, selectedTags])

  const fetchData = async () => {
    try {
      // Fetch teacher's classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('id, name, description')
        .eq('teacher_id', teacher.id)
        .order('name')

      if (classesError) {
        console.error('Error fetching classes:', classesError)
      } else {
        setClasses(classesData || [])
      }

      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('name')

      if (coursesError) {
        console.error('Error fetching courses:', coursesError)
      } else {
        setCourses(coursesData || [])
      }

      // Fetch tags
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('name')

      if (tagsError) {
        console.error('Error fetching tags:', tagsError)
      } else {
        setAvailableTags(tagsData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const fetchQuestions = async () => {
    try {
      // Fetch questions based on course or tags
      let questionsQuery = supabase
        .from('questions')
        .select(`
          id,
          title,
          content,
          course_id,
          image_url,
          created_at,
          courses(name)
        `)
        .eq('teacher_id', teacher.id)
        .order('created_at', { ascending: false })

      // Filter by course if selected
      if (courseId) {
        questionsQuery = questionsQuery.eq('course_id', courseId)
      }

      const { data: questionsData, error: questionsError } = await questionsQuery

      if (questionsError) {
        console.error('Error fetching questions:', questionsError)
        return
      }

      // If tags are selected, filter questions that have those tags
      let filteredQuestions = questionsData || []
      
      if (selectedTags.length > 0) {
        const questionTagsPromises = filteredQuestions.map(async (question) => {
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
          
          // Check if question has any of the selected tags
          const hasSelectedTag = tags.some(tag => 
            selectedTags.some(selectedTag => selectedTag.id === tag.id)
          )

          return hasSelectedTag ? { ...question, tags } : null
        })

        const questionsWithTags = await Promise.all(questionTagsPromises)
        filteredQuestions = questionsWithTags.filter(Boolean) as Question[]
      } else {
        // Add tags to questions even if not filtering by tags
        const questionsWithTagsPromises = filteredQuestions.map(async (question) => {
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
          return { ...question, tags }
        })

        filteredQuestions = await Promise.all(questionsWithTagsPromises)
      }

      setAvailableQuestions(filteredQuestions)
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  const toggleTag = (tag: Tag) => {
    setSelectedTags(prev => {
      const isSelected = prev.some(t => t.id === tag.id)
      if (isSelected) {
        return prev.filter(t => t.id !== tag.id)
      } else {
        return [...prev, tag]
      }
    })
  }

  const removeTag = (tagId: string) => {
    setSelectedTags(prev => prev.filter(t => t.id !== tagId))
  }

  const toggleQuestion = (question: Question) => {
    setSelectedQuestions(prev => {
      const isSelected = prev.some(q => q.id === question.id)
      if (isSelected) {
        return prev.filter(q => q.id !== question.id)
      } else {
        return [...prev, question]
      }
    })
  }

  const removeQuestion = (questionId: string) => {
    setSelectedQuestions(prev => prev.filter(q => q.id !== questionId))
  }

  const filteredAvailableQuestions = availableQuestions.filter(question =>
    question.title.toLowerCase().includes(questionSearchTerm.toLowerCase()) &&
    !selectedQuestions.some(selected => selected.id === question.id)
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim() || !classId) {
      setError('Please provide a session name and select a class')
      return
    }

    if (!courseId && selectedTags.length === 0 && selectedQuestions.length === 0) {
      setError('Please select either a course, at least one tag, or specific questions')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create session
      const sessionData = {
        name: name.trim(),
        description: description.trim() || null,
        teacher_id: teacher.id,
        class_id: classId,
        course_id: courseId || null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null
      }

      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert([sessionData])
        .select()
        .single()

      if (sessionError) {
        setError(sessionError.message)
        return
      }

      // Add session tags if any selected
      if (selectedTags.length > 0) {
        const sessionTagsData = selectedTags.map(tag => ({
          session_id: session.id,
          tag_id: tag.id
        }))

        const { error: tagsError } = await supabase
          .from('session_tags')
          .insert(sessionTagsData)

        if (tagsError) {
          console.error('Error adding session tags:', tagsError)
          // Don't fail the entire operation for tag errors
        }
      }

      // Add selected questions to session
      if (selectedQuestions.length > 0) {
        const sessionQuestionsData = selectedQuestions.map((question, index) => ({
          session_id: session.id,
          question_id: question.id,
          order_index: index
        }))

        const { error: questionsError } = await supabase
          .from('session_questions')
          .insert(sessionQuestionsData)

        if (questionsError) {
          console.error('Error adding session questions:', questionsError)
          // Don't fail the entire operation for question errors
        }
      }

      navigate('/')
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Set default expiration to 24 hours from now
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setExpiresAt(tomorrow.toISOString().slice(0, 16))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Play className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Session</h1>
                <p className="text-gray-600">Start a learning session for your students</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Session Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Session Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Algebra Practice Session, Quiz Review, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this session covers..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-vertical"
                disabled={loading}
              />
            </div>

            {/* Class Selection */}
            <div>
              <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-2">
                Class *
              </label>
              <div className="relative">
                <select
                  id="class"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 pl-11"
                  disabled={loading}
                >
                  <option value="">Select a class...</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Students from this class will be able to join the session
              </p>
            </div>

            {/* Course Selection */}
            <div>
              <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
                Course (Optional)
              </label>
              <div className="relative">
                <select
                  id="course"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 pl-11"
                  disabled={loading}
                >
                  <option value="">No specific course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
                <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Tags Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (Optional)
              </label>
              
              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                      <button
                        type="button"
                        onClick={() => removeTag(tag.id)}
                        className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full p-0.5 transition-colors duration-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Available Tags */}
              <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.some(t => t.id === tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        disabled={loading}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                          isSelected
                            ? 'text-white shadow-md'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                        style={isSelected ? { backgroundColor: tag.color } : {}}
                      >
                        <TagIcon className="w-3 h-3 mr-1" />
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Select tags to focus the session on specific topics
              </p>
            </div>

            {/* Question Selection */}
            {(courseId || selectedTags.length > 0) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specific Questions (Optional)
                </label>
                
                {/* Selected Questions */}
                {selectedQuestions.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Selected Questions ({selectedQuestions.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                      {selectedQuestions.map((question, index) => (
                        <div
                          key={question.id}
                          className="flex items-start justify-between p-2 bg-indigo-50 border border-indigo-200 rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-indigo-600">#{index + 1}</span>
                              <h5 className="font-medium text-gray-900 text-sm truncate">{question.title}</h5>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">{question.content}</p>
                            {question.tags && question.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {question.tags.map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="inline-block px-1.5 py-0.5 rounded text-xs font-medium text-white"
                                    style={{ backgroundColor: tag.color }}
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeQuestion(question.id)}
                            className="ml-2 p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors duration-200"
                            disabled={loading}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      Available Questions ({availableQuestions.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowQuestionSelector(!showQuestionSelector)}
                      className="flex items-center gap-1 px-2 py-1 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded transition-colors duration-200"
                      disabled={loading}
                    >
                      <Plus className="w-4 h-4" />
                      {showQuestionSelector ? 'Hide' : 'Add'} Questions
                    </button>
                  </div>

                  {showQuestionSelector && (
                    <div className="border border-gray-300 rounded-lg">
                      {/* Search */}
                      <div className="p-3 border-b border-gray-200">
                        <div className="relative">
                          <input
                            type="text"
                            value={questionSearchTerm}
                            onChange={(e) => setQuestionSearchTerm(e.target.value)}
                            placeholder="Search questions..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent pl-9"
                            disabled={loading}
                          />
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                      </div>

                      {/* Questions List */}
                      <div className="max-h-64 overflow-y-auto">
                        {filteredAvailableQuestions.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            {questionSearchTerm ? 'No matching questions found' : 'No questions available'}
                          </div>
                        ) : (
                          <div className="p-2 space-y-2">
                            {filteredAvailableQuestions.map((question) => (
                              <button
                                key={question.id}
                                type="button"
                                onClick={() => toggleQuestion(question)}
                                className="w-full text-left p-3 hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors duration-200"
                                disabled={loading}
                              >
                                <div className="flex items-start gap-3">
                                  {question.image_url && (
                                    <img
                                      src={question.image_url}
                                      alt=""
                                      className="w-12 h-12 object-cover rounded border border-gray-200 flex-shrink-0"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h5 className="font-medium text-gray-900 text-sm mb-1">{question.title}</h5>
                                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{question.content}</p>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      {question.course && (
                                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
                                          {question.course.name}
                                        </span>
                                      )}
                                      {question.tags && question.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {question.tags.slice(0, 3).map((tag) => (
                                            <span
                                              key={tag.id}
                                              className="px-1.5 py-0.5 rounded text-xs font-medium text-white"
                                              style={{ backgroundColor: tag.color }}
                                            >
                                              {tag.name}
                                            </span>
                                          ))}
                                          {question.tags.length > 3 && (
                                            <span className="text-gray-400">+{question.tags.length - 3}</span>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <p className="text-sm text-gray-500 mt-2">
                  Select specific questions to include in this session. Questions are filtered based on your course and tag selections.
                </p>
              </div>
            )}

            {/* Expiration */}
            <div>
              <label htmlFor="expires" className="block text-sm font-medium text-gray-700 mb-2">
                Session Expires (Optional)
              </label>
              <div className="relative">
                <input
                  id="expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 pl-11"
                  disabled={loading}
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Leave empty for sessions that don't expire automatically
              </p>
            </div>

            {/* Requirements Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> You must select either a course, at least one tag, or specific questions to create a session.
                This helps students understand what the session covers and enables question selection.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                disabled={loading}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading || !name.trim() || !classId || (!courseId && selectedTags.length === 0 && selectedQuestions.length === 0)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Session...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Create Session
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-3">Tips for Creating Sessions</h3>
          <ul className="space-y-2 text-purple-800 text-sm">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              Use descriptive names that clearly indicate the session's purpose
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              Select either a course for broad topics, specific tags for focused sessions, or individual questions
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              Choose specific questions to create targeted practice sessions or quizzes
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              Set expiration times for time-limited activities like quizzes or tests
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
              Students will only see sessions for classes they're enrolled in
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}