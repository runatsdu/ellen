import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Users, Mail, X, Plus, AlertCircle, Edit3, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Teacher } from '../hooks/useTeacher'

interface ClassMember {
  id: string
  user_email: string
  joined_at: string
}

interface ClassData {
  id: string
  name: string
  description: string | null
  created_at: string
  teacher_id: string
}

interface ClassDetailProps {
  teacher: Teacher
}

export default function ClassDetail({ teacher }: ClassDetailProps) {
  const navigate = useNavigate()
  const { classId } = useParams<{ classId: string }>()
  const [classData, setClassData] = useState<ClassData | null>(null)
  const [members, setMembers] = useState<ClassMember[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [newEmails, setNewEmails] = useState<string[]>([''])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    if (classId) {
      fetchClassData()
    }
  }, [classId])

  const fetchClassData = async () => {
    if (!classId) return

    try {
      // Fetch class data
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('*')
        .eq('id', classId)
        .eq('teacher_id', teacher.id)
        .single()

      if (classError) {
        console.error('Error fetching class:', classError)
        setError('Class not found or access denied')
        return
      }

      setClassData(classData)
      setName(classData.name)
      setDescription(classData.description || '')

      // Fetch class members
      const { data: membersData, error: membersError } = await supabase
        .from('class_members')
        .select('*')
        .eq('class_id', classId)
        .order('joined_at', { ascending: true })

      if (membersError) {
        console.error('Error fetching members:', membersError)
      } else {
        setMembers(membersData || [])
      }
    } catch (error) {
      console.error('Error fetching class data:', error)
      setError('Failed to load class data')
    } finally {
      setLoading(false)
    }
  }

  const addEmailField = () => {
    setNewEmails([...newEmails, ''])
    setTimeout(() => {
      const newIndex = newEmails.length
      const newInput = document.querySelector(`input[data-new-email-index="${newIndex}"]`) as HTMLInputElement
      if (newInput) {
        newInput.focus()
      }
    }, 50)
  }

  const removeEmailField = (index: number) => {
    if (newEmails.length > 1) {
      setNewEmails(newEmails.filter((_, i) => i !== index))
    }
  }

  const updateNewEmail = (index: number, value: string) => {
    const updatedEmails = newEmails.map((email, i) => 
      i === index ? value.trim().toLowerCase() : email
    )
    setNewEmails(updatedEmails)
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

    // Check for duplicates within new emails
    const duplicates = validEmails.filter((email, index) => 
      validEmails.indexOf(email) !== index
    )
    
    if (duplicates.length > 0) {
      errors.push(`Duplicate emails found: ${[...new Set(duplicates)].join(', ')}`)
    }

    // Check if email already exists in class
    const existingEmails = members.map(m => m.user_email)
    const alreadyExists = validEmails.filter(email => existingEmails.includes(email))
    
    if (alreadyExists.length > 0) {
      errors.push(`These emails are already in the class: ${alreadyExists.join(', ')}`)
    }

    return errors
  }

  const handleSaveClass = async () => {
    if (!classData) return

    if (!name.trim()) {
      setError('Please enter a class name')
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('classes')
        .update({
          name: name.trim(),
          description: description.trim() || null
        })
        .eq('id', classData.id)

      if (updateError) {
        setError(updateError.message)
        return
      }

      setClassData({ ...classData, name: name.trim(), description: description.trim() || null })
      setIsEditing(false)
    } catch (error) {
      setError('Failed to update class')
    } finally {
      setSaving(false)
    }
  }

  const handleAddMembers = async () => {
    if (!classData) return

    const validEmails = newEmails.filter(email => email.trim())
    if (validEmails.length === 0) {
      setError('Please add at least one email')
      return
    }

    const emailErrors = validateEmails(validEmails)
    if (emailErrors.length > 0) {
      setValidationErrors(emailErrors)
      setError('Please fix the email validation errors below')
      return
    }

    setSaving(true)
    setError(null)
    setValidationErrors([])

    try {
      const membersToInsert = validEmails.map(email => ({
        class_id: classData.id,
        user_email: email
      }))

      const { error: membersError } = await supabase
        .from('class_members')
        .insert(membersToInsert)

      if (membersError) {
        setError(`Failed to add members: ${membersError.message}`)
        return
      }

      // Refresh members list
      await fetchClassData()
      setNewEmails([''])
    } catch (error) {
      setError('Failed to add members')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this student from the class?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('class_members')
        .delete()
        .eq('id', memberId)

      if (error) {
        setError(`Failed to remove member: ${error.message}`)
        return
      }

      setMembers(members.filter(m => m.id !== memberId))
    } catch (error) {
      setError('Failed to remove member')
    }
  }

  const handleDeleteClass = async () => {
    if (!classData) return

    if (!confirm(`Are you sure you want to delete the class "${classData.name}"? This action cannot be undone.`)) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classData.id)

      if (error) {
        setError(`Failed to delete class: ${error.message}`)
        return
      }

      navigate('/')
    } catch (error) {
      setError('Failed to delete class')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading class...</p>
        </div>
      </div>
    )
  }

  if (!classData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Class not found</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 mb-8">
          <div className="flex items-center justify-between">
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
                  {isEditing ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-indigo-500 focus:outline-none"
                      disabled={saving}
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
                  )}
                  <p className="text-gray-600">{members.length} student{members.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false)
                      setName(classData.name)
                      setDescription(classData.description || '')
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveClass}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDeleteClass}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mt-4">
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Class description (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-vertical"
                disabled={saving}
              />
            ) : classData.description ? (
              <p className="text-gray-600">{classData.description}</p>
            ) : (
              <p className="text-gray-400 italic">No description</p>
            )}
          </div>
        </div>

        {/* Class Members */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 mb-8">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Class Members</h2>
            <p className="text-gray-600">{members.length} student{members.length !== 1 ? 's' : ''} enrolled</p>
          </div>
          
          <div className="p-6">
            {members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
                <p className="text-gray-600">Add students to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <Mail className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.user_email}</p>
                        <p className="text-sm text-gray-500">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Add New Members */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Add New Students</h2>
            <p className="text-gray-600">Add students by their email addresses</p>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Email Fields */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Student Emails
                </label>
                <button
                  type="button"
                  onClick={addEmailField}
                  disabled={saving}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Add Email
                </button>
              </div>
              
              <div className="space-y-3">
                {newEmails.map((email, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="email"
                        data-new-email-index={index}
                        value={email}
                        onChange={(e) => updateNewEmail(index, e.target.value)}
                        placeholder={`Student email ${index + 1}`}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 pl-11"
                        disabled={saving}
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    
                    {newEmails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmailField(index)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        disabled={saving}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
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

            {/* Add Members Button */}
            <div className="flex justify-end">
              <button
                onClick={handleAddMembers}
                disabled={saving || newEmails.filter(e => e.trim()).length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Add Students
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}