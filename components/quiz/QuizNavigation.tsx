import styles from './QuizNavigation.module.css'

export default function QuizNavigation({ current, questions, submitting, goNext, handleSubmit }: any) {
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