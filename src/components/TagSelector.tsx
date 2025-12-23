import React, { useState, useEffect } from 'react'
import { X, Plus, Tag as TagIcon, Search } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Tag {
  id: string
  name: string
  description: string | null
  color: string
}

interface TagSelectorProps {
  selectedTags: Tag[]
  onTagsChange: (tags: Tag[]) => void
  disabled?: boolean
}

export default function TagSelector({ selectedTags, onTagsChange, disabled }: TagSelectorProps) {
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTags()
  }, [])

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching tags:', error)
      } else {
        setAvailableTags(data || [])
      }
    } catch (error) {
      console.error('Error fetching tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTags = availableTags.filter(tag =>
    tag.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedTags.some(selected => selected.id === tag.id)
  )

  const addTag = (tag: Tag) => {
    onTagsChange([...selectedTags, tag])
    setSearchTerm('')
    setShowDropdown(false)
  }

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId))
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Tags
      </label>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag.id)}
                  className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full p-0.5 transition-colors duration-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Tag Search/Add */}
      {!disabled && (
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setShowDropdown(true)
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Søg og tilføj tags..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {loading ? (
                <div className="p-3 text-center text-gray-500">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Indlæser tags...
                </div>
              ) : filteredTags.length === 0 ? (
                <div className="p-3 text-center text-gray-500">
                  {searchTerm ? 'Ingen matchende tags fundet' : 'Ingen flere tags tilgængelige'}
                </div>
              ) : (
                <div className="py-1">
                  {filteredTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 transition-colors duration-200"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      ></div>
                      <div>
                        <div className="font-medium text-gray-900">{tag.name}</div>
                        {tag.description && (
                          <div className="text-xs text-gray-500">{tag.description}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        ></div>
      )}

      <p className="text-xs text-gray-500">
        Tilføj relevante tags for at hjælpe med at kategorisere og søge efter dette spørgsmål
      </p>
    </div>
  )
}