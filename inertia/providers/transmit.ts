import { createContext, useContext } from 'react'
import { Transmit } from '@adonisjs/transmit-client'

export const useTransmit = () => {
  const used = useContext(TransmitContext)

  if (!used) {
    throw new Error('useTransmit must be used within a TransmitProvider')
  }

  return used
}

export const TransmitContext = createContext<Transmit | null>(null)
