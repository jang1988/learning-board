import styles from './QuizHeader.module.css'
import type { QuizQuestionSafe } from '@/types'

export default function QuizHeader({
  current,
  questions,
  questionTimeLeft,
  formatTime
}: {
  current: number
  questions: QuizQuestionSafe[]
  questionTimeLeft: number
  formatTime: (time: number) => string
}) {
  const question = questions[current]

  const typeLabel = {
    single: 'Одна відповідь',
    multiple: 'Декілька відповідей',
    text: 'Текстова відповідь'
  }[question?.type ?? 'single']

  return (
    <>
      <div className={styles.header}>
        <div className={styles.qCounter}>
          Питання {current + 1} з {questions.length}
        </div>

        <div
          className={`${styles.timer} ${
            questionTimeLeft <= 10 ? styles.timerWarn : ''
          }`}
        >
          ⏱ {formatTime(questionTimeLeft)}
        </div>
      </div>

      <div className={styles.question}>
        <div className={styles.questionType}>
          {typeLabel}
        </div>

        <div className={styles.questionText}>
          {question?.text}
        </div>

        {question?.hint && (
          <div className={styles.hint}>
            {question.hint}
          </div>
        )}
      </div>
    </>
  )
}
