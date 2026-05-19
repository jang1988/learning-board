'use client'

import { createClient } from '@/lib/supabase/client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './QuizPlayer.module.css'

interface Props {
	quiz: any
	userId: string
	attemptNum: number
	onFinish: (result: { passed: boolean; percent: number; pending: boolean }) => void
}

export default function QuizPlayer({ quiz, userId, attemptNum, onFinish }: Props) {
	const questions = quiz.questions ?? []
	const QUESTION_TIME = 10

	// STATE
	const [started, setStarted] = useState(false)
	const [current, setCurrent] = useState(0)
	const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({})
	const [questionTimeLeft, setQuestionTimeLeft] = useState(QUESTION_TIME)
	const [submitting, setSubmitting] = useState(false)

	const finishedRef = useRef(false)
	const startTimeRef = useRef<number | null>(null)

	const question = questions[current]

	// Вспомогательная функция выхода из fullscreen
	const exitFullscreen = async () => {
		if (document.fullscreenElement) {
			try {
				await document.exitFullscreen()
			} catch (e) {
				console.warn('Exit fullscreen failed:', e)
			}
		}
	}

	const startQuiz = async () => {
		setStarted(true)
		startTimeRef.current = Date.now()
		try {
			await document.documentElement.requestFullscreen()
		} catch (e) {
			console.warn('Fullscreen blocked:', e)
		}
	}

	const spentTime = useMemo(() => {
		if (!startTimeRef.current) return 0
		return Math.floor((Date.now() - startTimeRef.current) / 1000)
	}, [current, questionTimeLeft])

	const formatTime = (sec: number) =>
		`${Math.floor(sec / 60)}:${(sec % 60).toString().padStart(2, '0')}`

	const goNext = useCallback(() => {
		if (current >= questions.length - 1) return
		setCurrent(prev => prev + 1)
		setQuestionTimeLeft(QUESTION_TIME)
	}, [current, questions.length])

	const goPrev = useCallback(() => {
		if (current <= 0) return
		setCurrent(prev => prev - 1)
		setQuestionTimeLeft(QUESTION_TIME)
	}, [current])

	const handleSubmit = useCallback(async () => {
		if (submitting || finishedRef.current) return
		finishedRef.current = true
		setSubmitting(true)

		const supabase = createClient()

		const autoQuestions = questions.filter((q: any) => q.type !== 'text')
		const textQuestions = questions.filter((q: any) => q.type === 'text')

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
		for (const q of autoQuestions) {
			const correctIds = allAnswers
				.filter((a: any) => a.question_id === q.id && a.is_correct)
				.map((a: any) => a.id)
				.sort()
			const chosen = (userAnswers[q.id] ?? []).sort()
			if (correctIds.join(',') === chosen.join(',')) {
				autoEarned += q.points
			}
		}

		const totalPoints = questions.reduce((sum: number, q: any) => sum + (q.points ?? 1), 0)
		const percent = totalPoints > 0 ? Math.round((autoEarned / totalPoints) * 100) : 0

		const filledText = textQuestions.filter((q: any) => userAnswers[q.id]?.[0]?.trim().length > 0)
		const pending = filledText.length > 0
		const passed = !pending && percent >= quiz.passing_score

		const { data: quizResult } = await supabase
			.from('quiz_results')
			.insert({
				user_id: userId,
				quiz_id: quiz.id,
				score: autoEarned,
				max_score: totalPoints,
				percent,
				passed,
				attempt_num: attemptNum,
				status: pending ? 'pending' : 'reviewed',
				time_spent_sec: spentTime
			})
			.select('id')
			.single()

		if (quizResult && filledText.length > 0) {
			await supabase.from('text_answers').insert(
				filledText.map((q: any) => ({
					quiz_result_id: quizResult.id,
					question_id: q.id,
					user_id: userId,
					answer_text: userAnswers[q.id][0].trim(),
					is_correct: null
				}))
			)
		}

		// Выход из fullscreen перед вызовом onFinish
		await exitFullscreen()
		onFinish({ passed, percent, pending })
	}, [submitting, questions, userAnswers, quiz, userId, attemptNum, spentTime, onFinish])

	useEffect(() => {
		if (!started || submitting) return
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
	}, [questionTimeLeft, current, questions.length, started, submitting, handleSubmit, goNext])

	const handleForceFinish = useCallback(async () => {
		if (submitting || finishedRef.current) return
		finishedRef.current = true
		setSubmitting(true)
		const supabase = createClient()
		await supabase.from('quiz_results').insert({
			user_id: userId,
			quiz_id: quiz.id,
			score: 0,
			max_score: questions.reduce((sum: number, q: any) => sum + (q.points ?? 1), 0),
			percent: 0,
			passed: false,
			attempt_num: attemptNum,
			status: 'reviewed',
			time_spent_sec: spentTime
		})
		// Выход из fullscreen перед вызовом onFinish
		await exitFullscreen()
		onFinish({ passed: false, percent: 0, pending: false })
	}, [submitting, userId, quiz, questions, attemptNum, spentTime, onFinish])

	useEffect(() => {
		if (!started) return
		const handler = () => {
			if (document.hidden) handleForceFinish()
		}
		document.addEventListener('visibilitychange', handler)
		return () => document.removeEventListener('visibilitychange', handler)
	}, [started, handleForceFinish])

	useEffect(() => {
		if (!started) return
		const handler = () => {
			if (!document.fullscreenElement) handleForceFinish()
		}
		document.addEventListener('fullscreenchange', handler)
		return () => document.removeEventListener('fullscreenchange', handler)
	}, [started, handleForceFinish])

	useEffect(() => {
		if (!started) return
		history.pushState(null, '', location.href)
		const handler = () => history.pushState(null, '', location.href)
		window.addEventListener('popstate', handler)
		return () => window.removeEventListener('popstate', handler)
	}, [started])

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (
				e.key === 'F12' ||
				(e.ctrlKey && e.shiftKey && e.key === 'I') ||
				(e.ctrlKey && e.key === 'u')
			) {
				e.preventDefault()
			}
		}
		window.addEventListener('keydown', handler)
		return () => window.removeEventListener('keydown', handler)
	}, [])

	const toggleAnswer = (answerId: string) => {
		const qid = question.id
		setUserAnswers(prev => {
			const currentAnswers = prev[qid] ?? []
			if (question.type === 'single') {
				return { ...prev, [qid]: [answerId] }
			}
			return {
				...prev,
				[qid]: currentAnswers.includes(answerId)
					? currentAnswers.filter(id => id !== answerId)
					: [...currentAnswers, answerId]
			}
		})
	}

	const chosen = userAnswers[question?.id] ?? []
	const isAnswered = (idx: number) => {
		const q = questions[idx]
		return q && userAnswers[q.id] && userAnswers[q.id].length > 0
	}

	if (!started) {
		return (
			<div className={styles.startScreen}>
				<div className={styles.startWarningIcon}>⚠️</div>

				<div className={styles.startBadge}>Важливе повідомлення</div>

				<h2>Перед початком</h2>

				<p className={styles.startDesc}>
					Цей тест працює у режимі <strong>реального іспиту</strong>. Будь ласка, уважно ознайомтесь
					з правилами перед початком.
				</p>

				<ul>
					<li>Таймер запускається одразу після старту</li>
					<li>Оновлення сторінки заборонено</li>
					<li>
						<strong>Не выходьте з повноекранного режиму</strong>
					</li>
					<li>Деякі питання можуть мати декілька правильних відповідей</li>
				</ul>

				<button
					className={styles.startBtn}
					onClick={startQuiz}
				>
					Розпочати тест
				</button>
			</div>
		)
	}

	return (
		<div className={styles.wrap}>
			<div className={styles.header}>
				<div className={styles.qCounter}>
					Питання {current + 1} з {questions.length}
				</div>
				<div className={`${styles.timer} ${questionTimeLeft <= 3 ? styles.timerWarn : ''}`}>
					⏱ {formatTime(questionTimeLeft)}
				</div>
			</div>

			<div className={styles.question}>
				<div className={styles.questionText}>{question?.text}</div>
				{question?.hint && <div className={styles.hint}>{question.hint}</div>}
			</div>

			{question?.type !== 'text' ? (
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
			) : (
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
			)}

			<div className={styles.nav}>
				<button
					className={styles.prevBtn}
					onClick={goPrev}
					disabled={current === 0 || submitting}
				>
					← Назад
				</button>

				<div className={styles.dots}>
					{questions.map((_: any, idx: number) => (
						<button
							key={idx}
							className={`${styles.dot} ${idx === current ? styles.dotCurrent : ''} ${
								isAnswered(idx) ? styles.dotAnswered : ''
							}`}
							onClick={() => {
								if (!submitting) {
									setCurrent(idx)
									setQuestionTimeLeft(QUESTION_TIME)
								}
							}}
							disabled={submitting}
						/>
					))}
				</div>

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
		</div>
	)
}
