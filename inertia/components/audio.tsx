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

  // const targetVolumeRef = useRef(
  //   muted.includes(participant.session_id)
  //     ? 0
  //     : calculateVolume(volume.volume ?? 100, volume.distance ?? 0) / 100
  // )

  // useEffect(() => {
  //   const audioElement = audioRef.current
  //   if (!audioElement) return

  //   targetVolumeRef.current = muted.includes(participant.session_id)
  //     ? 0
  //     : calculateVolume(volume.volume ?? 100, volume.distance ?? 0) / 100

  //   let frameId: any

  //   const smoothVolumeChange = () => {
  //     if (Math.abs(audioElement.volume - targetVolumeRef.current) > 0.01) {
  //       audioElement.volume += (targetVolumeRef.current - audioElement.volume) * 0.1
  //       frameId = requestAnimationFrame(smoothVolumeChange)
  //     } else {
  //       audioElement.volume = targetVolumeRef.current
  //       cancelAnimationFrame(frameId)
  //     }
  //   }

  //   frameId = requestAnimationFrame(smoothVolumeChange)

  //   // Cleanup function to cancel animation frame if the component unmounts
  //   return () => cancelAnimationFrame(frameId)
  // }, [volume])

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

    const audioContext = new AudioContext()
    const source = audioContext.createMediaElementSource(audioRef.current)
    const merger = audioContext.createChannelMerger(1)
    source.connect(merger).connect(audioContext.destination)

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
