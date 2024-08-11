import { Head } from '@inertiajs/react'
import { useEffect, useRef, useState } from 'react'
import { useTransmit } from '~/providers/transmit'
import Daily, { DailyCall, DailyParticipant } from '@daily-co/daily-js'
import Audio from '~/components/audio'
import { Volume2, VolumeX, RotateCcw } from 'lucide-react'
import { calculateVolume } from '~/utils/voice_chat'

interface HomeProps {
  userId: string
  email: string
  username: string
  displayName: string
  avatar: string
}

interface LogLine {
  player: string
  timestamp: string
  players: {
    name: string
    distance: number
  }[]
}

export default function Home(props: HomeProps) {
  const [hasConnected, setHasConnected] = useState(false)
  const transmit = useTransmit()
  const subscription = transmit.subscription('proxchat')
  const [userName, setUserName] = useState(props.displayName ?? props.username)
  const [isJoiningVC, setIsJoiningVC] = useState(false)
  const [hasJoinedVC, setHasJoinedVC] = useState(false)
  const [callObject, setCallObject] = useState<DailyCall | null>(null)
  const [participants, setParticipants] = useState<{ [key: string]: DailyParticipant }>({})
  const [participantsVolume, setParticipantsVolume] = useState<{
    [key: string]: { volume: number; distance: number }
  }>({})
  const [mutedParticipants, setMutedParticipants] = useState<string[]>([])
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([])
  const [selectedMic, setSelectedMic] = useState(null)
  const [isMuted, setIsMuted] = useState(false)

  const userNameRef = useRef(userName)
  const participantsRef = useRef(participants)

  useEffect(() => {
    participantsRef.current = participants
  }, [participants])

  // Update the ref whenever userName changes
  useEffect(() => {
    userNameRef.current = userName
  }, [userName])

  useEffect(() => {
    const handleDataMessage = (data: any) => {
      // console.log('data', data)

      if (data.player && data.players) {
        const logLine: LogLine = data
        const { player, players } = logLine
        // console.log(userNameRef.current)
        if (player === userNameRef.current) {
          for (const otherPlayer of players) {
            if (otherPlayer.name === userNameRef.current) {
              continue
            }

            // console.log('otherPlayer', otherPlayer)
            const sessionId = Object.keys(participantsRef.current).find(
              (key) => participantsRef.current[key].user_name === otherPlayer.name
            )

            // console.log(participantsRef.current)

            if (!sessionId) {
              console.log('Participant not found', otherPlayer.name)
              continue
            }

            setParticipantsVolume((prevVolumes) => ({
              ...prevVolumes,
              [sessionId]: {
                volume: participantsVolume[sessionId]?.volume,
                distance: otherPlayer.distance,
              },
            }))
          }
          // console.log('participants', participants)
          // console.log('participantsVolume', participantsVolume)
        }
      }
    }

    subscription.onMessage(handleDataMessage)
  }, [subscription])

  useEffect(() => {
    subscription
      .create()
      .then(() => {
        setHasConnected(true)
        console.log('Connected to the channel')
      })
      .catch((err) => {
        setHasConnected(false)
        console.log('Failed to connect to the channel', err)
      })

    return () => {
      subscription.delete()
    }
  }, [])

  const toggleMute = () => {
    console.log('toggleMute')
    if (!callObject) {
      return
    }

    console.log('isMuted', isMuted)

    if (isMuted) {
      callObject.setLocalAudio(true)
      setIsMuted(false)
    } else {
      callObject.setLocalAudio(false)
      setIsMuted(true)
    }
  }

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        console.log('Microphone access granted')

        return navigator.mediaDevices.enumerateDevices()
      })
      .then((devices) => {
        const mics = devices.filter((device) => device.kind === 'audioinput')
        // const outs = devices.filter((device) => device.kind === 'audiooutput')
        setMicrophones(mics)
        // setSpeakers(outs)
      })
  }, [])

  const handleMicChange = (e: any) => {
    const deviceId = e.target.value
    setSelectedMic(deviceId)

    callObject!.setInputDevicesAsync({ audioDeviceId: deviceId })
  }

  const joinVoiceChat = async () => {
    setIsJoiningVC(true)

    if (!callObject) {
      setIsJoiningVC(false)
      return
    }

    callObject
      .join({
        url: `https://hardcarryclub.daily.co/${import.meta.env.VITE_ROOM_ID}`,
        userName: userName,
        userData: {
          userId: props.userId,
          displayName: props.displayName,
          userName: props.username,
          avatar: props.avatar,
        },
      })
      .then(() => {
        setHasJoinedVC(true)
        setIsJoiningVC(false)
      })
      .catch((error) => {
        console.error('Failed to join Daily call:', error)
        setIsJoiningVC(false)
      })
  }

  useEffect(() => {
    if (!callObject) {
      const call = Daily.createCallObject()
      setCallObject(call)

      // Event listener for participant updates
      call.on('participant-updated', (event) => {
        console.log('participant-updated', event)
        if (event.participant.local) {
          return
        }

        setParticipants((prevParticipants) => ({
          ...prevParticipants,
          [event.participant.session_id]: event.participant,
        }))

        setParticipantsVolume((prevVolumes) => ({
          ...prevVolumes,
          [event.participant.session_id]: {
            volume: 100,
            distance: 0,
          },
        }))
      })

      // Event listener for when a participant leaves
      call.on('participant-left', (event) => {
        console.log('participant-left', event)
        setParticipants((prevParticipants) => {
          const updatedParticipants = { ...prevParticipants }
          delete updatedParticipants[event.participant.session_id]

          return updatedParticipants
        })

        setParticipantsVolume((prevVolumes) => {
          const updatedVolumes = { ...prevVolumes }
          delete updatedVolumes[event.participant.session_id]

          return updatedVolumes
        })
      })
    }

    return () => {
      if (callObject) {
        callObject.leave()
        callObject.destroy()
      }
    }
  }, [])

  const leaveVoiceChat = () => {
    if (callObject) {
      callObject.leave()
    }

    setHasJoinedVC(false)
  }

  if (!hasConnected) {
    return (
      <>
        <Head title="Connecting..." />
      </>
    )
  }

  if (!hasJoinedVC) {
    return (
      <>
        <Head title="Homepage" />

        <div className="flex h-screen">
          <div className="m-auto flex flex-col gap-4">
            <div>
              <label htmlFor="microphone-select">Select Microphone</label>
              <select
                className="select select-bordered w-full max-w-xs"
                id="microphone-select"
                value={selectedMic ?? undefined}
                onChange={handleMicChange}
              >
                {microphones.map((mic) => (
                  <option key={mic.deviceId} value={mic.deviceId}>
                    {mic.label || 'Unnamed Microphone'}
                  </option>
                ))}
              </select>
            </div>

            {/* <div>
              <label htmlFor="speaker-select">Select Speaker:</label>
              <select
                className="select select-bordered w-full max-w-xs"
                id="speaker-select"
                value={selectedSpeaker ?? undefined}
                onChange={handleSpeakerChange}
              >
                {speakers.map((speaker) => (
                  <option key={speaker.deviceId} value={speaker.deviceId}>
                    {speaker.label || 'Unnamed Speaker'}
                  </option>
                ))}
              </select>
            </div> */}

            <div>
              <h2 className="pb-2">Override Discord Username</h2>
              <label className="input input-bordered flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="h-4 w-4 opacity-70"
                >
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                </svg>
                <input
                  type="text"
                  className="grow"
                  placeholder="Username"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
              </label>
            </div>
            <button className="btn btn-active " onClick={joinVoiceChat} disabled={isJoiningVC}>
              {isJoiningVC ? 'Joining...' : 'Join VC'}
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head title="Homepage" />

      <div className="flex h-screen">
        <div className="m-auto grid grid-cols-2 gap-16">
          <div className="flex flex-col gap-4">
            <div className="avatar">
              <div className="w-8 rounded">
                <img src={props.avatar} />
              </div>
              <span className="ml-2">{props.displayName}</span>
              <span className="ml-2 text-xs text-gray-500">{userName}</span>
            </div>
            <div>
              <button
                className={`btn btn-sm w-full ${isMuted ? 'btn-secondary' : 'btn-primary'}`}
                onClick={toggleMute}
              >
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
            </div>

            <div className="mt-16">
              <button className="btn btn-sm w-full" onClick={leaveVoiceChat}>
                Leave
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {Object.values(participants)
              .filter((participant) => !participant.local)
              .map((participant) => (
                <div key={participant.session_id} className="flex gap-2 w-full">
                  {/* <pre>{JSON.stringify(participant, null, 2)}</pre> */}
                  {/* <img src={participant.userData.avatar} alt={participant.user_name || 'Unknown'} /> */}
                  <div>
                    <button
                      className="btn btn-square"
                      onClick={() => {
                        setMutedParticipants((prevMuted) => {
                          if (prevMuted.includes(participant.session_id)) {
                            return prevMuted.filter((id) => id !== participant.session_id)
                          } else {
                            return [...prevMuted, participant.session_id]
                          }
                        })
                      }}
                    >
                      {mutedParticipants.includes(participant.session_id) ? (
                        <VolumeX />
                      ) : (
                        <Volume2 />
                      )}
                    </button>
                  </div>
                  <div>
                    <img
                      src={(participant.userData as any).avatar}
                      alt={participant.user_name || 'Unknown'}
                      className="w-8 rounded"
                    />
                  </div>
                  <div>
                    <p>
                      {participant.user_name || 'Unknown'}
                      <span className="ml-2 text-xs text-gray-500">
                        {(participant.userData as any).displayName}
                      </span>
                      {import.meta.env.DEV
                        ? ` (Adj. Vol = ${Number(calculateVolume(participantsVolume[participant.session_id]?.volume ?? 100, participantsVolume[participant.session_id]?.distance ?? 0)).toPrecision(4)} /
                        ${Number(calculateVolume(participantsVolume[participant.session_id]?.volume ?? 100, participantsVolume[participant.session_id]?.distance ?? 0) / 100).toPrecision(2)})`
                        : ''}

                      <span>
                        <button
                          onClick={() => {
                            setParticipantsVolume((prevVolumes) => ({
                              ...prevVolumes,
                              [participant.session_id]: {
                                volume: prevVolumes[participant.session_id]?.volume ?? 100,
                                distance: 0,
                              },
                            }))
                          }}
                        >
                          <RotateCcw size={16} />
                        </button>
                      </span>
                    </p>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      defaultValue="100"
                      onChange={(e) => {
                        setParticipantsVolume((prevVolumes) => ({
                          ...prevVolumes,
                          [participant.session_id]: {
                            volume: Number.parseInt(e.target.value),
                            distance: prevVolumes[participant.session_id]?.distance ?? 0,
                          },
                        }))
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <Audio participants={participants} volumes={participantsVolume} muted={mutedParticipants} />
      </div>
    </>
  )
}
