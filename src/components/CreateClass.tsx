import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Users, Mail, X, Plus, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Teacher } from '../hooks/useTeacher'

interface CreateClassProps {
  teacher: Teacher
}

export default function CreateClass({ teacher }: CreateClassProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emails, setEmails] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const addEmailField = () => {
    setEmails([...emails, ''])
    // Focus on the new email field after a brief delay
    setTimeout(() => {
      const newIndex = emails.length
      const newInput = document.querySelector(`input[data-email-index="${newIndex}"]`) as HTMLInputElement
      if (newInput) {
        newInput.focus()
      }
    }, 50)
  }

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index))
    }
  }

  const updateEmail = (index: number, value: string) => {
    const updatedEmails = emails.map((email, i) => 
      i === index ? value.trim().toLowerCase() : email
    )
    setEmails(updatedEmails)
  }

  const validateEmails = (emailList: string[]): string[] => {
    const errors: string[] = []
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const validEmails = emailList.filter(email => email.trim())
    
    validEmails.forEach((email, index) => {
      if (!emailRegex.test(email)) {
        errors.push(`Email ${index + 1}: "${email}" is not a valid email address`)
      }
    })

    // Check for duplicates
    const duplicates = validEmails.filter((email, index) => 
      validEmails.indexOf(email) !== index
    )
    
    if (duplicates.length > 0) {
      errors.push(`Duplicate emails found: ${[...new Set(duplicates)].join(', ')}`)
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      setError('Please enter a class name')
      return
    }

    const validEmails = emails.filter(email => email.trim())
    if (validEmails.length === 0) {
      setError('Please add at least one student email')
      return
    }

    const emailErrors = validateEmails(validEmails)
    if (emailErrors.length > 0) {
      setValidationErrors(emailErrors)
      setError('Please fix the email validation errors below')
      return
    }

    setLoading(true)
    setError(null)
    setValidationErrors([])

    try {
      // Create the class
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .insert([
          {
            name: name.trim(),
            description: description.trim() || null,
            teacher_id: teacher.id
          }
        ])
        .select()
        .single()

      if (classError) {
        setError(classError.message)
        return
      }

      // Add class members
      const membersToInsert = validEmails.map(email => ({
        class_id: classData.id,
        user_email: email
      }))

      const { error: membersError } = await supabase
        .from('class_members')
        .insert(membersToInsert)

      if (membersError) {
        setError(`Class created but failed to add some members: ${membersError.message}`)
        // Still call onClassCreated since the class was created successfully
        setTimeout(() => navigate('/'), 2000)
      } else {
        navigate('/')
      }
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Tab' && !e.shiftKey && index === emails.length - 1 && emails.length < 20) {
      e.preventDefault()
      addEmailField()
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Class</h1>
                <p className="text-gray-600">Set up a new class and add students</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Class Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Class Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Math 5. Grade, Physics Advanced, etc."
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
                placeholder="Brief description of the class, curriculum, or any special notes..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 resize-vertical"
                disabled={loading}
              />
            </div>

            {/* Student Emails */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Student Emails *
                </label>
                <button
                  type="button"
                  onClick={addEmailField}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Add Email
                </button>
              </div>
              
              <div className="space-y-3">
                {emails.map((email, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="email"
                        data-email-index={index}
                        value={email}
                        onChange={(e) => updateEmail(index, e.target.value)}
                        onKeyDown={(e) => handleEmailKeyDown(e, index)}
                        placeholder={`Student email ${index + 1}`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 pl-11"
                        disabled={loading}
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    
                    {emails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmailField(index)}
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
                Students must have already created their accounts with these email addresses. Press Tab on the last field to add another email.
              </p>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Email Validation Errors</span>
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
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
                disabled={loading || !name.trim() || emails.filter(e => e.trim()).length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Class...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Class
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Tips for Creating Classes</h3>
          <ul className="space-y-2 text-blue-800 text-sm">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              Use descriptive names like "Math 5. Grade\" or \"Advanced Physics 2024"
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              Students must already have accounts with the email addresses you enter
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              Double-check email addresses for typos before creating the class
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              You can add more students to the class later if needed
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}