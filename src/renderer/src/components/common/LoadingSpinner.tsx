import React from 'react'

export function LoadingSpinner({ text = 'Загрузка...' }: { text?: string }) {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      <span style={{ marginLeft: 12 }}>{text}</span>
    </div>
  )
}
