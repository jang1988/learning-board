import { useState } from 'react'

import { completeLesson } from '@/lib/manager/completeLesson'

type Props = {
  initialCompletedIds: string[]

  lessonsTotal: number

  userId: string
  topicId: string

  onProgressUpdate: (
    lessonId: string,
    completed: boolean
  ) => void
}

export function useLessonProgress({
  initialCompletedIds,

  lessonsTotal,

  userId,
  topicId,

  onProgressUpdate
}: Props) {
  const [completedIds, setCompletedIds] =
    useState<Set<string>>(
      () => new Set(initialCompletedIds)
    )

  const isCompleted = (
    lessonId: string
  ) => {
    return completedIds.has(lessonId)
  }

  const markCompleted = async (
    lessonId: string
  ) => {
    if (completedIds.has(lessonId)) {
      return
    }

    // optimistic update

    setCompletedIds(prev => {
      const next = new Set(prev)

      next.add(lessonId)

      return next
    })

    onProgressUpdate(lessonId, true)

    try {
      await completeLesson({
        userId,
        lessonId,
        topicId,

        lessonsDone:
          completedIds.size + 1,

        lessonsTotal
      })
    } catch {
      // rollback

      setCompletedIds(prev => {
        const next = new Set(prev)

        next.delete(lessonId)

        return next
      })

      onProgressUpdate(
        lessonId,
        false
      )
    }
  }

  return {
    completedIds,

    isCompleted,

    markCompleted
  }
}