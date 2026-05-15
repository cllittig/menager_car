"use client"

import { memo, Suspense } from 'react'

interface LazyComponentProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}

const DefaultSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
)

export const LazyComponent = memo<LazyComponentProps>(({ 
  children, 
  fallback = <DefaultSkeleton />,
  className 
}) => (
  <Suspense fallback={fallback}>
    <div className={className}>
      {children}
    </div>
  </Suspense>
))

LazyComponent.displayName = 'LazyComponent'


export const useLazyLoading = (shouldLoad: boolean = true) => {
  return shouldLoad
}


interface LazyImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
}

export const LazyImage = memo<LazyImageProps>(({ 
  src, 
  alt, 
  className, 
  width, 
  height 
}) => (


  <img 
    src={src}
    alt={alt}
    className={className}
    width={width}
    height={height}
    loading="lazy"
    decoding="async"
    style={{ 
      contentVisibility: 'auto',
      containIntrinsicSize: width && height ? `${width}px ${height}px` : 'auto'
    }}
  />
))

LazyImage.displayName = 'LazyImage' 