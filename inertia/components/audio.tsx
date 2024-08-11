import { DailyParticipant } from '@daily-co/daily-js'
import { useEffect, useRef } from 'react'
import { calculateVolume } from '~/utils/voice_chat'

export function AudioItem({
  participant,
  volume,
  muted,
}: {
  participant: DailyParticipant
  volume: {
    volume: number
    distance: number
  }
  muted: string[]
}) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current) {
      if (muted.includes(participant.session_id)) {
        audioRef.current.volume = 0
      } else {
        const adjustedVolume = calculateVolume(volume.volume ?? 100, volume.distance ?? 0)
        console.log('volume in audio.tsx', volume)
        console.log('adjustedVolume in audio.tsx', adjustedVolume)
        audioRef.current.volume = adjustedVolume / 100
      }
    }
  }, [volume, audioRef])

  useEffect(() => {
    if (!audioRef.current || participant.local || !participant.tracks.audio.persistentTrack) {
      return
    }

    if (participant.tracks.audio.persistentTrack.kind !== 'audio') {
      return
    }

    audioRef.current.srcObject = new MediaStream([participant.tracks.audio.persistentTrack])
  }, [participant])

  return (
    <>
      <audio autoPlay playsInline id={`audio-${participant.user_id}`} ref={audioRef} />
    </>
  )
}

export default function Audio({
  participants,
  volumes,
  muted,
}: {
  participants: { [key: string]: DailyParticipant }
  volumes: {
    [key: string]: {
      volume: number
      distance: number
    }
  }
  muted: string[]
}) {
  return (
    <>
      {Object.values(participants).map((participant) => (
        <AudioItem
          key={participant.user_id}
          participant={participant}
          volume={volumes[participant.session_id] ?? { muted: false, volume: 100, distance: 0 }}
          muted={muted}
        />
      ))}
    </>
  )
}
