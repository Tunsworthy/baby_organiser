// Funny Futurama references for missing names
const FUTURAMA_NAMES = [
  'Fry',
  'Leela',
  'Bender',
  'Professor Farnsworth',
  'Hermes',
  'Amy Wong',
  'Zoidberg',
  'Scruffy',
  'The Robot Santa',
  'Kiff Kroker',
  'Calculon',
  'Lrrr from Omicron Persei 8',
  'Nibbler',
  'Lawyer Snagglepuss',
  'Robot Bender (variant)',
  'Turanga Leela',
  'Turbo Nebula',
  'Dr. Zoidberg',
  'Planet Express Staff Member',
  'Slurm Loco'
]

export function getRandomFuturamaName() {
  return FUTURAMA_NAMES[Math.floor(Math.random() * FUTURAMA_NAMES.length)]
}

export function getDisplayName(user) {
  if (!user) return getRandomFuturamaName()
  
  const firstName = user.firstName?.trim()
  if (firstName) return firstName
  
  return getRandomFuturamaName()
}

export function getMemberDisplayName(member) {
  if (!member) return getRandomFuturamaName()
  
  const firstName = member.firstName?.trim()
  if (firstName) return firstName
  
  return getRandomFuturamaName()
}
