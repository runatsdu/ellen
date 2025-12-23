import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Users, BookOpen, Tag as TagIcon, Clock, User, Play, FileText } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Question {
  id: string
  title: string
  content: string
  image_url: string | null
  order_index: number
}

interface SessionData {
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
  participants: Array<{
    user_email: string
    joined_at: string
  }>
  questions: Question[]
}

interface SessionPageProps {
  user: any
}

interface Answer {
  id: string
  content: string
  is_correct: boolean
  order_index: number
}

interface CurrentQuestion {
  id: string
  title: string
  content: string
  image_url: string | null
  answers: Answer[]
}

export default function SessionPage({ user }: SessionPageProps) {
  const navigate = useNavigate()
  const { sessionId } = useParams<{ sessionId: string }>()
  const [session, setSession] = useState<SessionData | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [questionLoading, setQuestionLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionId) {
      fetchSession()
    }
  }, [sessionId])

  useEffect(() => {
    if (session && !expired) {
      fetchRandomQuestion()
    }
  }, [session])

  const fetchSession = async () => {
    if (!sessionId) return

    try {
      // Fetch session data
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select(`
          id,
          name,
          description,
          created_at,
          expires_at,
          teachers!inner(email),
          classes!inner(name),
          courses(name)
        `)
        .eq('id', sessionId)
        .single()

      if (sessionError) {
        console.error('Error fetching session:', sessionError)
        setError('Session not found or access denied')
        return
      }

      // Fetch session tags
      const { data: sessionTags } = await supabase
        .from('session_tags')
        .select(`
          tags (
            id,
            name,
            color
          )
        `)
        .eq('session_id', sessionId)

      const tags = sessionTags?.map(st => st.tags).filter(Boolean) || []

      // Fetch participants
      const { data: participants } = await supabase
        .from('session_participants')
        .select('user_email, joined_at')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true })

      // Fetch session questions
      const { data: sessionQuestions } = await supabase
        .from('session_questions')
        .select(`
          order_index,
          questions (
            id,
            title,
            content,
            image_url
          )
        `)
        .eq('session_id', sessionId)
        .order('order_index', { ascending: true })

      const questions = sessionQuestions?.map(sq => ({
        ...sq.questions,
        order_index: sq.order_index
      })) || []

      setSession({
        id: sessionData.id,
        name: sessionData.name,
        description: sessionData.description,
        created_at: sessionData.created_at,
        expires_at: sessionData.expires_at,
        teacher_email: sessionData.teachers.email,
        class_name: sessionData.classes.name,
        course_name: sessionData.courses?.name || null,
        tags,
        participants: participants || [],
        questions
      })
    } catch (error) {
      console.error('Error fetching session:', error)
      setError('Failed to load session')
    } finally {
      setLoading(false)
    }
  }

  const fetchRandomQuestion = async () => {
    if (!session) return

    setQuestionLoading(true)
    try {
      let questionsQuery = supabase
        .from('questions')
        .select(`
          id,
          title,
          content,
          image_url,
          answers (
            id,
            content,
            is_correct,
            order_index
          )
        `)

      // If session has specific questions, use those
      if (session.questions.length > 0) {
        const questionIds = session.questions.map(q => q.id)
        questionsQuery = questionsQuery.in('id', questionIds)
      } else {
        // Otherwise filter by course or tags
        if (session.course_name) {
          const { data: courseData } = await supabase
            .from('courses')
            .select('id')
            .eq('name', session.course_name)
            .single()

          if (courseData) {
            questionsQuery = questionsQuery.eq('course_id', courseData.id)
          }
        }

        if (session.tags.length > 0) {
          const tagIds = session.tags.map(tag => tag.id)
          const { data: questionTagsData } = await supabase
            .from('question_tags')
            .select('question_id')
            .in('tag_id', tagIds)

          if (questionTagsData && questionTagsData.length > 0) {
            const questionIds = questionTagsData.map(qt => qt.question_id)
            questionsQuery = questionsQuery.in('id', questionIds)
          }
        }
      }

      const { data: questionsData, error: questionsError } = await questionsQuery

      if (questionsError) {
        console.error('Error fetching questions:', questionsError)
        return
      }

      if (questionsData && questionsData.length > 0) {
        // Select a random question
        const randomIndex = Math.floor(Math.random() * questionsData.length)
        const randomQuestion = questionsData[randomIndex]

        // Sort answers by order_index
        const sortedAnswers = randomQuestion.answers.sort((a, b) => a.order_index - b.order_index)

        setCurrentQuestion({
          ...randomQuestion,
          answers: sortedAnswers
        })
      }
    } catch (error) {
      console.error('Error fetching random question:', error)
    } finally {
      setQuestionLoading(false)
    }
  }

  const handleAnswerSelect = (answerId: string) => {
    if (showResult) return
    setSelectedAnswer(answerId)
  }

  const handleSubmitAnswer = () => {
    if (!selectedAnswer) return
    setShowResult(true)
  }

  const handleNextQuestion = () => {
    setCurrentQuestion(null)
    setSelectedAnswer(null)
    setShowResult(false)
    fetchRandomQuestion()
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Session not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const expired = isExpired(session.expires_at)
  const timeRemaining = getTimeRemaining(session.expires_at)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
          <div className="flex items-center gap-4 mb-6">
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
                <h1 className="text-2xl font-bold text-gray-900">{session.name}</h1>
                <p className="text-gray-600">Learning Session</p>
              </div>
            </div>
          </div>

          {/* Session Status */}
          <div className="flex items-center gap-4 mb-4">
            {expired ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                Session Expired
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                Active Session
              </span>
            )}
            {timeRemaining && (
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span className={expired ? 'text-red-500' : 'text-orange-500'}>
                  {timeRemaining}
                </span>
              </div>
            )}
          </div>

          {/* Session Description */}
          {session.description && (
            <p className="text-gray-700 mb-4">{session.description}</p>
          )}

          {/* Session Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span><strong>Class:</strong> {session.class_name}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span><strong>Teacher:</strong> {session.teacher_email}</span>
              </div>
              {session.course_name && (
                <div className="flex items-center gap-2 text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  <span><strong>Course:</strong> {session.course_name}</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="text-gray-600">
                <strong>Created:</strong> {new Date(session.created_at).toLocaleString()}
              </div>
              {session.expires_at && (
                <div className="text-gray-600">
                  <strong>Expires:</strong> {new Date(session.expires_at).toLocaleString()}
                </div>
              )}
              <div className="text-gray-600">
                <strong>Participants:</strong> {session.participants.length}
              </div>
            </div>
          </div>

          {/* Tags */}
          {session.tags.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Session Topics:</h3>
              <div className="flex flex-wrap gap-2">
                {session.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: tag.color }}
                  >
                    <TagIcon className="w-3 h-3" />
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Question Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Current Question</h2>
            <p className="text-gray-600">
              Answer the question below
            </p>
          </div>
          
          <div className="p-6">
            {expired ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Session Expired</h3>
                <p className="text-gray-600">This session is no longer active</p>
              </div>
            ) : questionLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading question...</p>
              </div>
            ) : currentQuestion ? (
              <div className="space-y-6">
                {/* Question */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    {currentQuestion.image_url && (
                      <div className="flex-shrink-0">
                        <img
                          src={currentQuestion.image_url}
                          alt="Question image"
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{currentQuestion.title}</h3>
                      <p className="text-gray-700 text-lg leading-relaxed">{currentQuestion.content}</p>
                    </div>
                  </div>
                </div>

                {/* Answer Options */}
                <div className="space-y-3">
                  <h4 className="text-lg font-semibold text-gray-900">Choose your answer:</h4>
                  {currentQuestion.answers.map((answer, index) => {
                    const isSelected = selectedAnswer === answer.id
                    const isCorrect = answer.is_correct
                    const showCorrectness = showResult
                    
                    let buttonClass = "w-full p-4 text-left border-2 rounded-lg transition-all duration-200 "
                    
                    if (showCorrectness) {
                      if (isCorrect) {
                        buttonClass += "border-green-500 bg-green-50 text-green-800"
                      } else if (isSelected && !isCorrect) {
                        buttonClass += "border-red-500 bg-red-50 text-red-800"
                      } else {
                        buttonClass += "border-gray-300 bg-gray-50 text-gray-600"
                      }
                    } else if (isSelected) {
                      buttonClass += "border-indigo-500 bg-indigo-50 text-indigo-800"
                    } else {
                      buttonClass += "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50"
                    }

                    return (
                      <button
                        key={answer.id}
                        onClick={() => handleAnswerSelect(answer.id)}
                        disabled={showResult}
                        className={buttonClass}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-semibold">
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="text-lg">{answer.content}</span>
                          {showCorrectness && isCorrect && (
                            <div className="ml-auto text-green-600">✓</div>
                          )}
                          {showCorrectness && isSelected && !isCorrect && (
                            <div className="ml-auto text-red-600">✗</div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-center pt-4">
                  {!showResult ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={!selectedAnswer}
                      className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNextQuestion}
                      className="px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                    >
                      Next Question
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Available</h3>
                <p className="text-gray-600">
                  There are no questions available for this session topic.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}