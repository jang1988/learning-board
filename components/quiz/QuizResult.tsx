'use client'

import Link from 'next/link'
import styles from './QuizResult.module.css'

interface QuizResultProps {
  percent: number
  passed: boolean
  pending?: boolean
  passingScore: number
  topicId: string
  attemptsLeft: number
  onRetry?: () => void
}

export default function QuizResult({
  percent,
  passed,
  pending,
  passingScore,
  topicId,
  attemptsLeft,
  onRetry,
}: QuizResultProps) {
  if (pending) {
    return (
      <div className={styles.wrap}>
        <div className={styles.pendingBox}>
          <div className={styles.pendingIcon}>
            ⏳
          </div>

          <h2 className={styles.title}>
            Тест отправлен на проверку
          </h2>

          <p className={styles.sub}>
            Текстовые ответы ожидают
            проверки администратором.
          </p>

          <div className={styles.actions}>
            <Link
              href={`/manager/topics/${topicId}`}
              className={styles.backBtn}
            >
              ← К теме
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div
        className={`${styles.circle} ${
          passed
            ? styles.circlePass
            : styles.circleFail
        }`}
      >
        <span className={styles.circleIcon}>
          {passed ? '✓' : '✕'}
        </span>

        <span className={styles.circleScore}>
          {percent}%
        </span>

        <span className={styles.circleLabel}>
          результат
        </span>
      </div>

      <h2 className={styles.title}>
        {passed
          ? '🎉 Тест пройден!'
          : '😔 Тест не пройден'}
      </h2>

      <p className={styles.sub}>
        {passed
          ? `Отличная работа! Вы набрали ${percent}% при минимуме ${passingScore}%.`
          : `Вы набрали ${percent}%, необходимо ${passingScore}%.`}
      </p>

      <div className={styles.actions}>
        {!passed &&
          attemptsLeft > 0 &&
          onRetry && (
            <button
              className={styles.retryBtn}
              onClick={onRetry}
            >
              ↺ Попробовать снова
            </button>
          )}

        <Link
          href={`/manager/topics/${topicId}`}
          className={styles.backBtn}
        >
          ← К теме
        </Link>

        <Link
          href="/manager/dashboard"
          className={styles.homeBtn}
        >
          На главную
        </Link>
      </div>
    </div>
  )
}