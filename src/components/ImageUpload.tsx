import React, { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react'
import { processImage, validateImageFile, formatFileSize, ProcessedImage } from '../utils/imageUtils'

interface ImageUploadProps {
  onImageProcessed: (processedImage: ProcessedImage | null) => void
  currentImage?: string
  disabled?: boolean
}

export default function ImageUpload({ onImageProcessed, currentImage, disabled }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    setError(null)
    setProcessing(true)

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      setProcessing(false)
      return
    }

    try {
      const processed = await processImage(file)
      setProcessedImage(processed)
      onImageProcessed(processed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image')
      onImageProcessed(null)
    } finally {
      setProcessing(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (disabled) return
    handleFiles(e.dataTransfer.files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (disabled) return
    handleFiles(e.target.files)
  }

  const handleClick = () => {
    if (disabled) return
    fileInputRef.current?.click()
  }

  const removeImage = () => {
    setProcessedImage(null)
    setError(null)
    onImageProcessed(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const hasImage = processedImage || currentImage

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Question Image (Optional)
      </label>
      
      {hasImage ? (
        <div className="space-y-4">
          {/* Image Preview */}
          <div className="relative inline-block">
            <img
              src={processedImage?.dataUrl || currentImage}
              alt="Question image"
              className="max-w-full h-auto max-h-64 rounded-lg border border-gray-300 shadow-sm"
            />
            {!disabled && (
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Image Info */}
          {processedImage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Image processed successfully</span>
              </div>
              <div className="text-xs text-green-700 space-y-1">
                <p>Original size: {formatFileSize(processedImage.originalSize)}</p>
                <p>Optimized size: {formatFileSize(processedImage.processedSize)}</p>
                <p>Savings: {Math.round((1 - processedImage.processedSize / processedImage.originalSize) * 100)}%</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors duration-200 ${
            dragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-gray-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
            disabled={disabled}
          />
          
          <div className="text-center">
            {processing ? (
              <div className="space-y-2">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-gray-600">Processing image...</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-center">
                  {dragActive ? (
                    <Upload className="w-8 h-8 text-indigo-600" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {dragActive ? 'Drop image here' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPEG, PNG, WebP, or GIF up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        Images are automatically converted to WebP format and optimized for web delivery
      </p>
    </div>
  )
}