'use client'

import { useState } from 'react'
import QuizPlayer from '@/components/quiz/QuizPlayer'
import QuizResult from '@/components/quiz/QuizResult'
import styles from './quiz.module.css'

interface Props {
  quiz: any
  userId: string
  topicId: string
  attemptNum: number
  attemptsLeft: number
}

interface ResultType {
  passed: boolean
  percent: number
  pending: boolean
}

export default function QuizPageClient({ quiz, userId, topicId, attemptNum, attemptsLeft }: Props) {
  const [result, setResult] = useState<ResultType | null>(null)
  const [currentAttempt, setCurrentAttempt] = useState(attemptNum)
  const [retrying, setRetrying] = useState(false)

  const handleRetry = () => {
    setResult(null)
    setCurrentAttempt(prev => prev + 1)
    setRetrying(true)
    setTimeout(() => setRetrying(false), 100)
  }

  if (result) {
    return (
      <div className={styles.page}>
        <QuizResult
          percent={result.percent}
          passed={result.passed}
          pending={result.pending}
          passingScore={quiz.passing_score}
          topicId={topicId}
          attemptsLeft={attemptsLeft}
          onRetry={
            attemptsLeft > 0 && !result.passed && !result.pending
              ? handleRetry
              : undefined
          }
        />
      </div>
    )
  }

  if (retrying) return null

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.attempt}>
          Спроба {currentAttempt} з {quiz.max_attempts}
        </div>
      </div>
      <QuizPlayer
        quiz={quiz}
        userId={userId}
        attemptNum={currentAttempt}
        onFinish={setResult}
      />
    </div>
  )
}
