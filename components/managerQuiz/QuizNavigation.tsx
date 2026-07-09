import styles from './QuizNavigation.module.css'
import type { QuizQuestionSafe } from '@/types'

type Props = {
	current: number
	questions: QuizQuestionSafe[]
	submitting: boolean
	goNext: () => void
	handleSubmit: () => void
}

export default function QuizNavigation({ current, questions, submitting, goNext, handleSubmit }: Props) {
	return (
		<div className={styles.nav}>
				{current < questions.length - 1 ? (
					<button
						className={styles.nextBtn}
						onClick={goNext}
						disabled={submitting}
					>
						Далі →
					</button>
				) : (
					<button
						className={styles.submitBtn}
						onClick={handleSubmit}
						disabled={submitting}
					>
						Завершити
					</button>
				)}
			</div>
	)
}
