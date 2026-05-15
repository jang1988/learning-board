'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import styles from './QuizPlayer.module.css'

interface Props {
	quiz: any
	userId: string
	attemptNum: number
	onFinish: (result: {
		passed: boolean
		percent: number
		pending: boolean
	}) => void
}

export default function QuizPlayer({
	quiz,
	userId,
	attemptNum,
	onFinish
}: Props) {
	const questions = quiz.questions ?? []

	const QUESTION_TIME = 10 // 1 хвилина на питання

	const [current, setCurrent] = useState(0)

	const [userAnswers, setUserAnswers] = useState<
		Record<string, string[]>
	>({})

	const [questionTimeLeft, setQuestionTimeLeft] =
		useState(QUESTION_TIME)

	const [submitting, setSubmitting] = useState(false)

	const [visitedQuestions, setVisitedQuestions] = useState<number[]>([0])

	const question = questions[current]

	const spentTime = useMemo(() => {
		return (
			current * QUESTION_TIME +
			(QUESTION_TIME - questionTimeLeft)
		)
	}, [current, questionTimeLeft])

	// Формат часу
	const formatTime = (sec: number) =>
		`${Math.floor(sec / 60)}:${(sec % 60)
			.toString()
			.padStart(2, '0')}`

	// Перехід до наступного питання
	const goNext = useCallback(() => {
		if (current >= questions.length - 1) return

		const nextIndex = current + 1

		setCurrent(nextIndex)
		setQuestionTimeLeft(QUESTION_TIME)

		setVisitedQuestions(prev =>
			prev.includes(nextIndex)
				? prev
				: [...prev, nextIndex]
		)
	}, [current, questions.length])

	// Submit тесту
	const handleSubmit = useCallback(async () => {
		if (submitting) return

		setSubmitting(true)

		const supabase = createClient()

		const autoQuestions = questions.filter(
			(q: any) => q.type !== 'text'
		)

		const textQuestions = questions.filter(
			(q: any) => q.type === 'text'
		)

		let allAnswers: any[] = []

		if (autoQuestions.length > 0) {
			const { data } = await supabase
				.from('answers')
				.select('id, question_id, is_correct')
				.in(
					'question_id',
					autoQuestions.map((q: any) => q.id)
				)

			allAnswers = data ?? []
		}

		let autoEarned = 0
		let autoTotal = 0

		for (const q of autoQuestions) {
			autoTotal += q.points

			const correctIds = allAnswers
				.filter(
					(a: any) =>
						a.question_id === q.id &&
						a.is_correct
				)
				.map((a: any) => a.id)
				.sort()

			const chosen = (
				userAnswers[q.id] ?? []
			).sort()

			if (
				correctIds.join(',') ===
				chosen.join(',')
			) {
				autoEarned += q.points
			}
		}

		const totalPoints = questions.reduce(
			(sum: number, q: any) =>
				sum + (q.points ?? 1),
			0
		)

		const percent =
			totalPoints > 0
				? Math.round(
						(autoEarned / totalPoints) * 100
				  )
				: 0

		const filledText = textQuestions.filter(
			(q: any) =>
				userAnswers[q.id]?.[0]
					?.trim()
					.length > 0
		)

		const pending = filledText.length > 0

		const passed =
			!pending &&
			percent >= quiz.passing_score

		const { data: quizResult } =
			await supabase
				.from('quiz_results')
				.insert({
					user_id: userId,
					quiz_id: quiz.id,
					score: autoEarned,
					max_score: totalPoints,
					percent,
					passed,
					attempt_num: attemptNum,
					status: pending
						? 'pending'
						: 'reviewed',
					time_spent_sec: spentTime
				})
				.select('id')
				.single()

		// Текстові відповіді
		if (quizResult && filledText.length > 0) {
			await supabase
				.from('text_answers')
				.insert(
					filledText.map((q: any) => ({
						quiz_result_id:
							quizResult.id,
						question_id: q.id,
						user_id: userId,
						answer_text:
							userAnswers[q.id][0].trim(),
						is_correct: null
					}))
				)
		}

		onFinish({
			passed,
			percent,
			pending
		})
	}, [
		submitting,
		questions,
		userAnswers,
		quiz,
		userId,
		attemptNum,
		spentTime,
		onFinish
	])

	// Таймер питання
	useEffect(() => {
		if (submitting) return

		// Час вийшов
		if (questionTimeLeft <= 0) {
			if (current === questions.length - 1) {
				handleSubmit()
			} else {
				goNext()
			}
			return
		}

		const timer = setTimeout(() => {
			setQuestionTimeLeft(prev => prev - 1)
		}, 1000)

		return () => clearTimeout(timer)
	}, [
		questionTimeLeft,
		current,
		questions.length,
		handleSubmit,
		goNext,
		submitting
	])

	// Вибір відповіді
	const toggleAnswer = (answerId: string) => {
		const qid = question.id

		setUserAnswers(prev => {
			const currentAnswers = prev[qid] ?? []

			// SINGLE
			if (question.type === 'single') {
				return {
					...prev,
					[qid]: [answerId]
				}
			}

			// MULTIPLE
			const next = currentAnswers.includes(
				answerId
			)
				? currentAnswers.filter(
						(id: string) =>
							id !== answerId
				  )
				: [...currentAnswers, answerId]

			return {
				...prev,
				[qid]: next
			}
		})
	}

	const chosen =
		userAnswers[question?.id] ?? []

	return (
		<div className={styles.wrap}>
			{/* HEADER */}
			<div className={styles.header}>
				<div className={styles.headerLeft}>
					<div className={styles.qCounter}>
						Питання {current + 1} з{' '}
						{questions.length}
					</div>

					<div className={styles.quizTitle}>
						{quiz.title}
					</div>
				</div>

				<div className={styles.timerGroup}>
					{/* Таймер питання */}
					<div
						className={`${styles.timer} ${
							questionTimeLeft <= 15
								? styles.timerWarn
								: ''
						}`}
					>
						⏱ {formatTime(questionTimeLeft)}
					</div>
				</div>
			</div>

			{/* Progress */}
			<div
				className="progress-bar"
				style={{ marginBottom: 24 }}
			>
				<div
					className="progress-bar__fill"
					style={{
						width: `${
							((current + 1) /
								questions.length) *
							100
						}%`
					}}
				/>
			</div>

			{/* QUESTION */}
			<div className={styles.question}>
				<p className={styles.questionText}>
					{question?.text}
				</p>

				{question?.type === 'multiple' && (
					<p className={styles.hint}>
						Виберіть усі правильні
						варіанти
					</p>
				)}

				{question?.type === 'text' && (
					<p className={styles.hint}>
						✏️ Відповідь перевіряється
						адміністратором
					</p>
				)}
			</div>

			{/* ANSWERS */}
			{question?.type !== 'text' ? (
				<div className={styles.answers}>
					{question?.answers?.map(
						(answer: any) => {
							const selected =
								chosen.includes(
									answer.id
								)

							return (
								<button
									key={answer.id}
									type="button"
									className={`${styles.answerBtn} ${
										selected
											? styles.selected
											: ''
									}`}
									onClick={() =>
										toggleAnswer(
											answer.id
										)
									}
								>
									<span
										className={`${
											styles.answerCheck
										} ${
											selected
												? styles.checkSelected
												: ''
										}`}
									>
										{question.type ===
										'single'
											? selected
												? '●'
												: '○'
											: selected
												? '✓'
												: '□'}
									</span>

									{answer.text}
								</button>
							)
						}
					)}
				</div>
			) : (
				<textarea
					className={styles.textAnswer}
					placeholder="Введіть вашу відповідь..."
					value={chosen[0] ?? ''}
					onChange={e =>
						setUserAnswers(prev => ({
							...prev,
							[question.id]: [
								e.target.value
							]
						}))
					}
					rows={5}
				/>
			)}

			{/* NAV */}
			<div className={styles.nav}>

				{/* NEXT / SUBMIT */}
				{current <
				questions.length - 1 ? (
					<button
						className={styles.nextBtn}
						onClick={goNext}
					>
						Далі →
					</button>
				) : (
					<button
						className={styles.submitBtn}
						onClick={handleSubmit}
						disabled={submitting}
					>
						{submitting
							? 'Надсилання...'
							: 'Завершити тест'}
					</button>
				)}
			</div>
		</div>
	)
}