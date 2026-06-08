import styles from './QuizTextAnswer.module.css'

export default function QuizTextAnswer({ question, chosen, setUserAnswers }: any) {
	return (
		<textarea
					className={styles.textAnswer}
					value={chosen[0] ?? ''}
					onChange={e =>
						setUserAnswers((prev: any) => ({
							...prev,
							[question.id]: [e.target.value]
						}))
					}
					placeholder="Введіть відповідь..."
					rows={4}
				/>
	)
}