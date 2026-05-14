'use client'
import Link from 'next/link'
import styles from './QuizResult.module.css'

interface Props {
  percent: number
  passed: boolean
  passingScore: number
  topicId: string
  attemptsLeft: number
  hasPendingReview?: boolean
  onRetry?: () => void
}

export default function QuizResult({ percent, passed, passingScore, topicId, attemptsLeft, hasPendingReview, onRetry }: Props) {

  if (hasPendingReview) {
    return (
      <div className={styles.wrap}>
        <div className={`${styles.circle} ${styles.circlePending}`}>
          <span className={styles.circleIcon}>⏳</span>
          <span className={styles.circleScore}>{percent}%</span>
          <span className={styles.circleLabel}>авто</span>
        </div>
        <h2 className={styles.title}>Відповіді надіслано</h2>
        <p className={styles.sub}>
          Тест містить текстові відповіді, які перевіряє адміністратор.
          Автоматично перевірені питання: <strong>{percent}%</strong>.
          Остаточний результат буде доступний після перевірки.
        </p>
        <div className={styles.pendingBadge}>
          ⏳ Очікує перевірки адміністратора
        </div>
        <div className={styles.actions}>
          <Link href={`/manager/topics/${topicId}`} className={styles.backBtn}>← До теми</Link>
          <Link href="/manager/results" className={styles.homeBtn}>Мої результати</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <div className={`${styles.circle} ${passed ? styles.circlePass : styles.circleFail}`}>
        <span className={styles.circleIcon}>{passed ? '✓' : '✕'}</span>
        <span className={styles.circleScore}>{percent}%</span>
        <span className={styles.circleLabel}>результат</span>
      </div>

      <h2 className={styles.title}>{passed ? '🎉 Тест пройдено!' : '😔 Тест не пройдено'}</h2>
      <p className={styles.sub}>
        {passed
          ? `Чудова робота! Ви набрали ${percent}% при мінімумі ${passingScore}%.`
          : `Ви набрали ${percent}%, необхідно ${passingScore}%.${attemptsLeft > 0 ? ` Залишилось спроб: ${attemptsLeft}.` : ' Спроби закінчились.'}`
        }
      </p>

      <div className={styles.actions}>
        {!passed && attemptsLeft > 0 && onRetry && (
          <button className={styles.retryBtn} onClick={onRetry}>↺ Спробувати знову</button>
        )}
        <Link href={`/manager/topics/${topicId}`} className={styles.backBtn}>← До теми</Link>
        <Link href="/manager/dashboard" className={styles.homeBtn}>На головну</Link>
      </div>
    </div>
  )
}
