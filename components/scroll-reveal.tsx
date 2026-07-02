'use client'
import { useEffect } from 'react'

export function ScrollRevealScript() {
  useEffect(() => {
    document.documentElement.classList.add('js-ready')

    const els = document.querySelectorAll<HTMLElement>('[data-reveal]')
    if (!els.length) return

    const timers: ReturnType<typeof setTimeout>[] = []

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target as HTMLElement
          const delay = Number(el.dataset.revealDelay ?? 0)
          if (delay) {
            const id = setTimeout(() => el.classList.add('revealed'), delay)
            timers.push(id)
          } else {
            el.classList.add('revealed')
          }
          observer.unobserve(el)
        })
      },
      { threshold: 0.07, rootMargin: '0px 0px -40px 0px' }
    )

    els.forEach((el) => observer.observe(el))
    return () => {
      observer.disconnect()
      timers.forEach(clearTimeout)
    }
  }, [])

  return null
}
