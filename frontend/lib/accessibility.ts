




export function isVisuallyHidden(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element)
  return (
    style.position === 'absolute' &&
    style.left === '-10000px' ||
    style.clip === 'rect(0, 0, 0, 0)' ||
    style.clipPath === 'inset(50%)' ||
    style.overflow === 'hidden' &&
    style.position === 'absolute' &&
    style.height === '1px' &&
    style.width === '1px'
  )
}


export function hasAdequateContrast(
  foregroundColor: string,
  backgroundColor: string,
  isLargeText = false
): boolean {


  const minRatio = isLargeText ? 3 : 4.5


  const getLuminance = (hex: string): number => {
    void hex

    return 0.5 
  }

  const l1 = getLuminance(foregroundColor)
  const l2 = getLuminance(backgroundColor)
  const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)

  return contrast >= minRatio
}


export function hasAccessibleLabel(element: HTMLElement): boolean {
  const ariaLabel = element.getAttribute('aria-label')
  const ariaLabelledBy = element.getAttribute('aria-labelledby')
  const title = element.getAttribute('title')
  const alt = element.getAttribute('alt')


  if (element.tagName === 'INPUT') {
    const id = element.getAttribute('id')
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`)
      if (label) return true
    }
  }

  return !!(ariaLabel || ariaLabelledBy || title || alt)
}


export function isKeyboardAccessible(element: HTMLElement): boolean {
  const tabIndex = element.getAttribute('tabindex')
  const isInteractive = [
    'button', 'input', 'select', 'textarea', 'a'
  ].includes(element.tagName.toLowerCase())


  if (tabIndex && parseInt(tabIndex) < 0) return false


  if (isInteractive) return true


  const role = element.getAttribute('role')
  if (['button', 'link', 'tab', 'menuitem'].includes(role || '')) {
    return tabIndex === '0' || tabIndex === null
  }

  return false
}


export function auditPageAccessibility(): Array<{
  type: 'error' | 'warning' | 'info'
  message: string
  element?: HTMLElement
}> {
  const issues: Array<{
    type: 'error' | 'warning' | 'info'
    message: string
    element?: HTMLElement
  }> = []


  const title = document.querySelector('title')
  if (!title || !title.textContent?.trim()) {
    issues.push({
      type: 'error',
      message: 'Página não possui título adequado para SEO e acessibilidade'
    })
  }


  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
  if (headings.length === 0) {
    issues.push({
      type: 'warning', 
      message: 'Página não possui estrutura de cabeçalhos (h1-h6)'
    })
  }

  const h1Count = document.querySelectorAll('h1').length
  if (h1Count === 0) {
    issues.push({
      type: 'error',
      message: 'Página deve ter pelo menos um elemento h1'
    })
  } else if (h1Count > 1) {
    issues.push({
      type: 'warning',
      message: 'Página tem múltiplos elementos h1 - considere usar h2-h6'
    })
  }


  const images = document.querySelectorAll('img')
  images.forEach(img => {
    if (!img.getAttribute('alt')) {
      issues.push({
        type: 'error',
        message: 'Imagem sem atributo alt',
        element: img
      })
    }
  })


  const inputs = document.querySelectorAll('input, select, textarea')
  inputs.forEach(input => {
    if (!hasAccessibleLabel(input as HTMLElement)) {
      issues.push({
        type: 'error',
        message: 'Campo de formulário sem label acessível',
        element: input as HTMLElement
      })
    }
  })


  const customButtons = document.querySelectorAll('[role="button"]')
  customButtons.forEach(button => {
    if (!isKeyboardAccessible(button as HTMLElement)) {
      issues.push({
        type: 'error',
        message: 'Elemento com role="button" não é acessível via teclado',
        element: button as HTMLElement
      })
    }
  })

  return issues
}


export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message


  announcement.style.position = 'absolute'
  announcement.style.left = '-10000px'
  announcement.style.width = '1px'
  announcement.style.height = '1px'
  announcement.style.overflow = 'hidden'

  document.body.appendChild(announcement)


  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}


export function enhanceListNavigation(listElement: HTMLElement) {
  const items = listElement.querySelectorAll('[role="listitem"], li')
  let currentIndex = 0

  const focusItem = (index: number) => {
    items.forEach((item, i) => {
      if (i === index) {
        (item as HTMLElement).focus()
        item.setAttribute('aria-selected', 'true')
      } else {
        item.setAttribute('aria-selected', 'false')
      }
    })
  }

  listElement.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        currentIndex = Math.min(currentIndex + 1, items.length - 1)
        focusItem(currentIndex)
        break
      case 'ArrowUp':
        e.preventDefault()
        currentIndex = Math.max(currentIndex - 1, 0)
        focusItem(currentIndex)
        break
      case 'Home':
        e.preventDefault()
        currentIndex = 0
        focusItem(currentIndex)
        break
      case 'End':
        e.preventDefault()
        currentIndex = items.length - 1
        focusItem(currentIndex)
        break
    }
  })
}


export const srOnlyClass = `
  .sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }

  .sr-only-focusable:focus {
    position: static !important;
    width: auto !important;
    height: auto !important;
    padding: inherit !important;
    margin: inherit !important;
    overflow: visible !important;
    clip: auto !important;
    white-space: inherit !important;
  }
` 