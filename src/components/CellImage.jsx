import React from 'react'

export function CellImage({ imageUrl }) {
  if (!imageUrl) return null
  return (
    <img
      src={imageUrl}
      alt="VEX TM Screen"
      className="cell-image"
    />
  )
}
