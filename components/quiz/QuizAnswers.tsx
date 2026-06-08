import styles from './QuizAnswers.module.css'

export default function QuizAnswers({ question, chosen, toggleAnswer }: any) {
	return (
		<div className={styles.answers}>
			{question?.answers?.map((a: any) => {
				const selected = chosen.includes(a.id)
				return (
					<button
						key={a.id}
						onClick={() => toggleAnswer(a.id)}
						className={`${styles.answerBtn} ${selected ? styles.selected : ''}`}
					>
						<span className={`${styles.answerCheck} ${selected ? styles.checkSelected : ''}`}>
							{selected ? '✓' : '○'}
						</span>
						{a.text}
					</button>
				)
			})}
		</div>
	)
}
