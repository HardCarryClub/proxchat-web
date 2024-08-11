const volumeDecayRate = 0.25

export function calculateVolume(volume: number, distance: number, disableLog = true): number {
  if (!disableLog) {
    console.log('volume', volume)
    console.log('distance', distance)
    console.log('volumeDecayRate', volumeDecayRate)
  }

  const reduction = distance / volumeDecayRate

  if (!disableLog) {
    console.log('reduction', reduction)
  }

  const adjustedVolume = Math.max(0, volume - reduction)

  if (!disableLog) {
    console.log('adjustedVolume', adjustedVolume)
  }

  return adjustedVolume
}
