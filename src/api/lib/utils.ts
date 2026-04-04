export const toTimestamp = (date: Date) =>
  new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour12: false,
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== 'literal') acc[part.type] = part.value
      return acc
    }, {})

export const toFormattedTimestamp = (date: Date) => {
  const p = toTimestamp(date)
  return `${p.hour}:${p.minute}:${p.second} ${p.day}.${p.month}.${p.year}`
}
