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
	return (
		<>
			<div className={styles.header}>
				<div className={styles.qCounter}>
					Питання {current + 1} з {questions.length}
				</div>
				<div className={`${styles.timer} ${questionTimeLeft <= 3 ? styles.timerWarn : ''}`}>
					⏱ {formatTime(questionTimeLeft)}
				</div>
			</div>

			<div className={styles.question}>
				<div className={styles.questionText}>{questions[current]?.text}</div>
				{questions[current]?.hint && <div className={styles.hint}>{questions[current].hint}</div>}
			</div>
		</>
	)
}
