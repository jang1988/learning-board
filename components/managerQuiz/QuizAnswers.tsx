import styles from './QuizAnswers.module.css'
import type { QuizQuestionSafe } from '@/types'

type Props = {
	question: QuizQuestionSafe
	chosen: string[]
	toggleAnswer: (answerId: string) => void
}

export default function QuizAnswers({ question, chosen, toggleAnswer }: Props) {
	return (
		<div className={styles.answers}>
			{question.answers?.map(a => {
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
