export function enrichTopics(topics: any[], userId: string) {
  return (
    topics?.map(topic => {
      const lessons = topic.lessons ?? []

      const lessonsTotal = lessons.length

      const lessonsDone = lessons.filter((lesson: any) =>
        lesson.lesson_progress?.some(
          (progress: any) =>
            progress.user_id === userId &&
            progress.status === 'completed'
        )
      ).length

      const status =
        lessonsDone === 0
          ? 'not_started'
          : lessonsDone === lessonsTotal
            ? 'completed'
            : 'in_progress'

      const pct =
        lessonsTotal > 0
          ? Math.round((lessonsDone / lessonsTotal) * 100)
          : 0

      return {
        ...topic,
        lessonsTotal,
        lessonsDone,
        status,
        pct,
        hasQuiz: (topic.quizzes?.length ?? 0) > 0
      }
    }) ?? []
  )
}