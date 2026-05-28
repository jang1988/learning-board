import { useMemo, useState } from 'react'

type Props = {
  initialCompletedIds: string[]
  lessonsTotal: number
}

export function useTopicProgress({
  initialCompletedIds,
  lessonsTotal
}: Props) {
  const [completedIds, setCompletedIds] =
    useState<Set<string>>(
      () => new Set(initialCompletedIds)
    )

  const lessonsDone =
    completedIds.size

  const progressPct = useMemo(() => {
    if (!lessonsTotal) return 0

    return Math.round(
      (lessonsDone / lessonsTotal) * 100
    )
  }, [lessonsDone, lessonsTotal])

  const allLessonsDone =
    lessonsDone === lessonsTotal

  const updateCompleted = (
    lessonId: string,
    completed: boolean
  ) => {
    setCompletedIds(prev => {
      const next = new Set(prev)

      completed
        ? next.add(lessonId)
        : next.delete(lessonId)

      return next
    })
  }

  return {
    completedIds,

    lessonsDone,

    progressPct,

    allLessonsDone,

    updateCompleted
  }
}