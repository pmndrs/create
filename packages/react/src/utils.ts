/**
 * Generates a random name in the format "adjective-noun"
 * @returns A randomly generated name string
 */
export function generateRandomName(): string {
  const adjectives = [
    'red',
    'blue',
    'green',
    'yellow',
    'purple',
    'orange',
    'pink',
    'black',
    'white',
    'tiny',
    'big',
    'small',
    'large',
    'huge',
    'giant',
    'mini',
    'mega',
    'super',
    'happy',
    'sad',
    'angry',
    'calm',
    'quiet',
    'loud',
    'silent',
    'noisy',
    'shiny',
    'dull',
    'bright',
    'dark',
    'fuzzy',
    'smooth',
    'rough',
    'soft',
  ]

  const nouns = [
    'apple',
    'banana',
    'cherry',
    'date',
    'elderberry',
    'fig',
    'grape',
    'honeydew',
    'cat',
    'dog',
    'elephant',
    'fox',
    'giraffe',
    'horse',
    'iguana',
    'jaguar',
    'mountain',
    'river',
    'ocean',
    'desert',
    'forest',
    'jungle',
    'meadow',
    'valley',
    'star',
    'moon',
    'sun',
    'planet',
    'comet',
    'asteroid',
    'galaxy',
    'universe',
  ]

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]

  return `${randomAdjective}-${randomNoun}`
}
