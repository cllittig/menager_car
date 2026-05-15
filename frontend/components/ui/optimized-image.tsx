'use client'

import { cn } from '@/lib/utils'
import Image, { ImageProps } from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'alt'> {
  src: string
  alt: string
  fallbackSrc?: string
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape'
  className?: string
  containerClassName?: string
  priority?: boolean
  loading?: 'lazy' | 'eager'
  quality?: number
}

const aspectRatioClasses = {
  square: 'aspect-square',
  video: 'aspect-video', 
  portrait: 'aspect-[3/4]',
  landscape: 'aspect-[4/3]'
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder.jpg',
  aspectRatio,
  className,
  containerClassName,
  priority = false,
  loading = 'lazy',
  quality = 80,
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc)
      setHasError(false)
    } else {
      setHasError(true)
    }
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  return (
    <div 
      className={cn(
        'relative overflow-hidden bg-muted',
        aspectRatio && aspectRatioClasses[aspectRatio],
        containerClassName
      )}
    >
      {!hasError ? (
        <>
          {isLoading && (
            <div className="absolute inset-0 animate-pulse bg-muted" />
          )}
          <Image
            src={imgSrc}
            alt={alt}
            fill={!props.width && !props.height}
            priority={priority}
            loading={priority ? undefined : loading}
            quality={quality}
            onError={handleError}
            onLoad={handleLoad}
            className={cn(
              'object-cover transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100',
              className
            )}
            {...props}
          />
        </>
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted">
          <div className="text-center text-muted-foreground">
            <svg
              className="mx-auto h-12 w-12 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm">Imagem não disponível</p>
          </div>
        </div>
      )}
    </div>
  )
}


export function useImagePreloader(urls: string[]) {
  useState(() => {
    urls.forEach(url => {
      const img = new window.Image()
      img.src = url
    })
  })
} 