import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface Teacher {
  id: string
  email: string
  created_at: string
}

export function useTeacher(userEmail: string | undefined) {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  
  // In development, simulate teacher records for fake logins
  const isDevelopment = import.meta.env.DEV
  const teacherEmails = ['teacher1@school.edu', 'teacher2@school.edu', 'admin@school.edu']

  useEffect(() => {
    async function checkTeacher() {
      if (!userEmail) {
        setLoading(false)
        return
      }

      // For development fake logins, create mock teacher records
      if (isDevelopment && userEmail && teacherEmails.includes(userEmail)) {
        const mockTeacher: Teacher = {
          id: `fake-teacher-${userEmail}`,
          email: userEmail,
          created_at: new Date().toISOString()
        }
        setTeacher(mockTeacher)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking teacher status:', error)
        }

        setTeacher(data || null)
      } catch (error) {
        console.error('Error checking teacher status:', error)
      } finally {
        setLoading(false)
      }
    }

    checkTeacher()
  }, [userEmail])

  return { teacher, loading, isTeacher: !!teacher }
}