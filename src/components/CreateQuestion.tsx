import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, FileText, Type, Plus, X, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Teacher } from '../hooks/useTeacher'
import ImageUpload from './ImageUpload'
import TagSelector from './TagSelector'
import { ProcessedImage } from '../utils/imageUtils'

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

interface Answer {
  content: string
  is_correct: boolean
}

interface CreateQuestionProps {
  teacher: Teacher
}

export default function CreateQuestion({ teacher }: CreateQuestionProps) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [courseId, setCourseId] = useState('')
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedTags, setSelectedTags] = useState<Tag[]>([])
  const [answers, setAnswers] = useState<Answer[]>([
    { content: '', is_correct: false },
    { content: '', is_correct: false }
  ])
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching courses:', error)
      } else {
        setCourses(data || [])
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const addAnswer = () => {
    if (answers.length < 8) {
      setAnswers([...answers, { content: '', is_correct: false }])
      // Focus on the new answer field after a brief delay
      setTimeout(() => {
        const newIndex = answers.length
        const newInput = document.querySelector(`input[data-answer-index="${newIndex}"]`) as HTMLInputElement
        if (newInput) {
          newInput.focus()
        }
      }, 50)
    }
  }

  const removeAnswer = (index: number) => {
    if (answers.length > 2) {
      setAnswers(answers.filter((_, i) => i !== index))
    }
  }

  const updateAnswer = (index: number, field: keyof Answer, value: string | boolean) => {
    const updatedAnswers = answers.map((answer, i) => 
      i === index ? { ...answer, [field]: value } : answer
    )
    setAnswers(updatedAnswers)
  }

  const toggleCorrectAnswer = (index: number) => {
    const updatedAnswers = answers.map((answer, i) => ({
      ...answer,
      is_correct: i === index ? !answer.is_correct : answer.is_correct
    }))
    setAnswers(updatedAnswers)
  }

  const handleAnswerKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Tab' && !e.shiftKey && index === answers.length - 1 && answers.length < 8) {
      e.preventDefault()
      addAnswer()
    }
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim() || !courseId) {
      setError('Please fill in title, content, and select a course')
      return
    }

    // Validate answers
    const validAnswers = answers.filter(answer => answer.content.trim())
    if (validAnswers.length < 2) {
      setError('Please provide at least 2 answers')
      return
    }

    const correctAnswers = validAnswers.filter(answer => answer.is_correct)
    if (correctAnswers.length === 0) {
      setError('Please mark at least one answer as correct')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let imageUrl = null
      let imageFilename = null

      // Upload image if present
      if (processedImage) {
        const fileExt = 'webp'
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = fileName

        const { error: uploadError } = await supabase.storage
          .from('question-images')
          .upload(filePath, processedImage.file)

        if (uploadError) {
          setError(`Failed to upload image: ${uploadError.message}`)
          return
        }

        const { data: { publicUrl } } = supabase.storage
          .from('question-images')
          .getPublicUrl(filePath)

        imageUrl = publicUrl
        imageFilename = processedImage.file.name
      }

      // Insert question first
      const { data: questionData, error: questionError } = await supabase
        .from('questions')
        .insert([
          {
            title: title.trim(),
            content: content.trim(),
            course_id: courseId,
            teacher_id: teacher.id,
            image_url: imageUrl,
            image_filename: imageFilename
          }
        ])
        .select()
        .single()

      if (questionError) {
        setError(questionError.message)
        return
      }

      // Insert question_tags relationships
      if (selectedTags.length > 0) {
        const questionTagsToInsert = selectedTags.map(tag => ({
          question_id: questionData.id,
          tag_id: tag.id
        }))

        const { error: tagsError } = await supabase
          .from('question_tags')
          .insert(questionTagsToInsert)

        if (tagsError) {
          console.error('Error inserting question tags:', tagsError)
          // Don't fail the entire operation for tag errors
        }
      }

      // Insert answers
      const answersToInsert = validAnswers.map((answer, index) => ({
        question_id: questionData.id,
        content: answer.content.trim(),
        is_correct: answer.is_correct,
        order_index: index
      }))

      const { error: answersError } = await supabase
        .from('answers')
        .insert(answersToInsert)

      if (answersError) {
        setError(answersError.message)
      } else {
        navigate('/')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

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
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Question</h1>
                <p className="text-gray-600">Add a new question to your collection</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Title Field */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Question Title
              </label>
              <div className="relative">
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a clear, descriptive title for your question"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 pl-11"
                  disabled={loading}
                />
                <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Content Field */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Question Content
              </label>
              <div className="relative">
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write the full question content, including any instructions or context students might need..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-vertical"
                  disabled={loading}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Provide clear instructions and any necessary context for students
              </p>
            </div>

            {/* Course Selection */}
            <div>
              <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-2">
                Course
              </label>
              <select
                id="course"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                disabled={loading}
              >
                <option value="">Select a course...</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-2">
                Choose the subject area this question belongs to
              </p>
            </div>

            {/* Image Upload */}
            <ImageUpload
              onImageProcessed={setProcessedImage}
              disabled={loading}
            />

            {/* Tags */}
            <TagSelector
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              disabled={loading}
            />

            {/* Answers Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Answer Options
                </label>
                <button
                  type="button"
                  onClick={addAnswer}
                  disabled={answers.length >= 8 || loading}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Add Answer ({answers.length}/8)
                </button>
              </div>
              
              <div className="space-y-3">
                {answers.map((answer, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <input
                        type="text"
                        data-answer-index={index}
                        value={answer.content}
                        onChange={(e) => updateAnswer(index, 'content', e.target.value)}
                        onKeyDown={(e) => handleAnswerKeyDown(e, index)}
                        placeholder={`Answer ${index + 1}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                        disabled={loading}
                      />
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => toggleCorrectAnswer(index)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        answer.is_correct
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      disabled={loading}
                    >
                      <Check className="w-4 h-4" />
                      {answer.is_correct ? 'Correct' : 'Mark Correct'}
                    </button>
                    
                    {answers.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeAnswer(index)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        disabled={loading}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              
              <p className="text-sm text-gray-500 mt-2">
                Add 2-8 answer options and mark the correct ones. Students will see these as multiple choice options.
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
                disabled={loading || !title.trim() || !content.trim() || !courseId || answers.filter(a => a.content.trim()).length < 2}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Question
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Tips for Creating Great Questions</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              Use clear, specific language that students can easily understand
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              Include any necessary context or background information
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              Consider providing examples or hints when appropriate
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              Provide clear, distinct answer options with at least one correct answer
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              Make sure the question and answers align with your learning objectives
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}