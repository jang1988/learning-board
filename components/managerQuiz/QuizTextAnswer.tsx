import styles from './QuizTextAnswer.module.css'
import type { Dispatch, SetStateAction } from 'react'
import type { QuizQuestionSafe, UserAnswers } from '@/types'

type Props = {
	question: QuizQuestionSafe
	chosen: string[]
	setUserAnswers: Dispatch<SetStateAction<UserAnswers>>
}

export default function QuizTextAnswer({ question, chosen, setUserAnswers }: Props) {
	return (
		<textarea
					className={styles.textAnswer}
					value={chosen[0] ?? ''}
					onChange={e =>
						setUserAnswers(prev => ({
							...prev,
							[question.id]: [e.target.value]
						}))
					}
					placeholder="Введіть відповідь..."
					rows={4}
				/>
	)
}
