type Props = {
  isPending: boolean
  hasPassed: boolean
  allLessonsDone: boolean
  attemptsLeft: number
  quizResult: any
}

export function useQuizAccess({
  isPending,
  hasPassed,
  allLessonsDone,
  attemptsLeft,
  quizResult
}: Props) {
  const canStartQuiz =
    !isPending &&
    !hasPassed &&
    (allLessonsDone || quizResult) &&
    attemptsLeft > 0

  const isLocked =
    !allLessonsDone && !quizResult

  return {
    canStartQuiz,
    isLocked
  }
}