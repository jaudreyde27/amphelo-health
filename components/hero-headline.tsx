'use client'

import { useState, useEffect } from 'react'

const pronouns = ['your', 'their']

export function HeroHeadline() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % pronouns.length)
        setVisible(true)
      }, 350)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <style>{`
        .word-swap {
          display: inline;
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        .word-swap-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .word-swap-hidden {
          opacity: 0;
          transform: translateY(-8px);
        }
      `}</style>

      {/* Static line 1 */}
      <div>You keep</div>
      <div>everything moving.</div>

      {/* Line 2 — only pronoun toggles */}
      <div>You shouldn&apos;t chase</div>
      <div>
        <span className="underline underline-offset-4 decoration-2">
          <span
            key={index}
            className={`word-swap ${visible ? 'word-swap-visible' : 'word-swap-hidden'}`}
          >
            {pronouns[index]}
          </span>
          {' '}care
        </span>
        {' '}too.
      </div>
    </div>
  )
}
