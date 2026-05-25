export function calcTopicProgress(topics: any[], userId: string) {
  return topics?.map(topic => {
    const lessons = topic.lessons ?? []

    const total = lessons.length

    const done = lessons.filter((l: any) =>
      l.lesson_progress?.some(
        (p: any) =>
          p.user_id === userId &&
          p.status === 'completed'
      )
    ).length

    const status =
      done === 0
        ? 'not_started'
        : done === total
          ? 'completed'
          : 'in_progress'

    const pct =
      total > 0
        ? Math.round((done / total) * 100)
        : 0

    return {
      ...topic,
      lessonsDone: done,
      lessonsTotal: total,
      status,
      pct
    }
  }) ?? []
}