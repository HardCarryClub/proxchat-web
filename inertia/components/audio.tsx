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
    setTimeout(() => {
      console.log('unmuting')
      if (audioRef.current.muted) {
        audioRef.current.muted = false
      }
    }, 2500)
  }, [])

  // const handleUserInteraction = () => {
  //   const audioElement = audioRef.current
  //   if (audioElement) {
  //     audioElement.muted = false // Unmute the audio
  //     audioElement
  //       .play()
  //       .then(() => console.log('playing'))
  //       .catch((error) => {
  //         console.log('Autoplay was prevented, user interaction required:', error)
  //       })
  //   }
  // }

  // useEffect(() => {
  //   const audioElement = audioRef.current

  //   // Check if audio should be played on user interaction
  //   const playAudio = () => {
  //     if (audioElement) {
  //       audioElement.play().catch((error) => {
  //         console.log('Autoplay was prevented, user interaction required')
  //       })
  //     }
  //   }

  //   setTimeout(() => {
  //     // Add an event listener for user interaction
  //     document.addEventListener('click', playAudio, { once: true })
  //   }, 1000)

  //   return () => {
  //     document.removeEventListener('click', playAudio)
  //   }
  // }, [])

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
    // const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    // const source = audioContext.createMediaStreamSource(stream)

    // // Create a merger with 1 channel, effectively making the output mono
    // const merger = audioContext.createChannelMerger(1)

    // // Connect the source to the merger, only to the first output channel (index 0)
    // source.connect(merger, 0, 0)

    // // Connect the merger to a MediaStream destination
    // const destination = audioContext.createMediaStreamDestination()
    // merger.connect(destination)

    // // Set the mono stream as the source for the audio element
    // audioRef.current.srcObject = destination.stream

    audioRef.current.srcObject = stream
  }, [participant])

  return (
    <>
      {/* <button onClick={() => audioRef.current?.play()}>Enable {participant.user_name}</button> */}
      <audio autoPlay playsInline muted id={`audio-${participant.user_id}`} ref={audioRef} />
      {/* <button onClick={handleUserInteraction}>Enable Audio</button> */}
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
