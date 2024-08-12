import { DailyParticipant } from '@daily-co/daily-js'
import { useEffect, useRef } from 'react'
import { calculateVolume } from '~/utils/voice_chat'

export function AudioItem({
  participant,
  volume,
  distance,
  muted,
}: {
  participant: DailyParticipant
  volume: number
  distance: number
  muted: boolean
}) {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    if (audioRef.current) {
      if (muted) {
        audioRef.current.volume = 0
      } else {
        const adjustedVolume = calculateVolume(volume ?? 100, distance ?? 0)
        audioRef.current.volume = adjustedVolume / 100

        if ((window as any).DEBUG) {
          console.log(
            `AudioItem: ${participant.user_id} volume: ${volume} distance: ${distance} adjustedVolume: ${adjustedVolume}`
          )
        }
      }
    }
  }, [volume, distance, audioRef, muted])

  useEffect(() => {
    if (!audioRef.current || participant.local || !participant.tracks.audio.persistentTrack) {
      return
    }

    if (participant.tracks.audio.persistentTrack.kind !== 'audio') {
      return
    }

    const stream = new MediaStream([participant.tracks.audio.persistentTrack])

    // Create an AudioContext and convert the stream to mono
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const source = audioContext.createMediaStreamSource(stream)

    // Create a merger with 1 channel, effectively making the output mono
    const merger = audioContext.createChannelMerger(1)

    // Connect the source to the merger, only to the first output channel (index 0)
    source.connect(merger, 0, 0)

    // Connect the merger to a MediaStream destination
    const destination = audioContext.createMediaStreamDestination()
    merger.connect(destination)

    // Set the mono stream as the source for the audio element
    audioRef.current.srcObject = destination.stream

    // audioRef.current.srcObject = stream
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
      {Object.values(participants)
        .filter(
          (p) => volumes[p.session_id] && volumes[p.session_id].volume !== undefined && !p.local
        )
        .map((participant) => (
          <AudioItem
            key={participant.user_id}
            participant={participant}
            volume={volumes[participant.session_id].volume}
            distance={volumes[participant.session_id].distance}
            muted={muted.includes(participant.session_id)}
          />
        ))}
    </>
  )
}
