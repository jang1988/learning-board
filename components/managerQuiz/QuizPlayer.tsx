'use client'

import { useCallback, useRef, useState } from 'react'

import QuizAnswers from './QuizAnswers'
import QuizHeader from './QuizHeader'
import QuizNavigation from './QuizNavigation'
import QuizStartScreen from './QuizStartScreen'
import QuizTextAnswer from './QuizTextAnswer'

import { useQuizSecurity } from '@/hooks/useQuizSecurity'
import { useQuizSubmission } from '@/hooks/useQuizSubmission'
import { useQuizTimer } from '@/hooks/useQuizTimer'
import { enterFullscreen, exitFullscreen } from '@/lib/manager/fullscreen'

import type { QuizMetaSafe, QuizQuestionSafe, SubmitResult, UserAnswers } from '@/types'
import styles from './QuizPlayer.module.css'

// ─── Constants ────────────────────────────────────────────────────────────────

const QUESTION_TIME = 30

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
	quiz: QuizMetaSafe
	attemptNum: number
	onFinish: (result: SubmitResult) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuizPlayer({ quiz, attemptNum, onFinish }: Props) {
	const questions = (quiz.questions ?? []) as QuizQuestionSafe[]

	// ── State ───────────────────────────────────────────────────────────────
	const [started, setStarted] = useState(false)
	const [current, setCurrent] = useState(0)
	const [userAnswers, setUserAnswers] = useState<UserAnswers>({})
	const [submitting, setSubmitting] = useState(false)

	const startTimeRef = useRef<number>(0)

	// Единственный источник истины — разделяется между submit и forceFinish
	const finishedRef = useRef(false)

	const question = questions[current]

	// ── Submission hook ─────────────────────────────────────────────────────
	const { submit } = useQuizSubmission({
		quiz,
		attemptNum,
		userAnswers,
		startTimeRef,
		finishedRef, // ← передаём единый флаг
	})

	// ── Start ───────────────────────────────────────────────────────────────
	const startQuiz = async () => {
		setStarted(true)
		startTimeRef.current = Date.now()
		await enterFullscreen()
	}

	// ── Navigation ──────────────────────────────────────────────────────────
	const goNext = useCallback(() => {
		setCurrent(c => Math.min(c + 1, questions.length - 1))
	}, [questions.length])

	// ── Submit ──────────────────────────────────────────────────────────────
	// finishedRef проверяется внутри submit() — дублировать здесь не нужно
	const handleSubmit = useCallback(async () => {
		setSubmitting(true)
		const result = await submit()
		await exitFullscreen()
		onFinish(result)
	}, [submit, onFinish])

	// ── Force finish (anti-cheat violation) ─────────────────────────────────
	const handleForceFinish = useCallback(async () => {
		if (finishedRef.current) return
		setSubmitting(true)

		const result = await submit({ forceFail: true })
		await exitFullscreen()
		onFinish(result)
	}, [submit, onFinish])

	const handleViolation = useCallback(() => {
		handleForceFinish()
	}, [handleForceFinish])

	// ── Timer ────────────────────────────────────────────────────────────────
	const handleTimeExpire = useCallback(() => {
		if (current >= questions.length - 1) {
			handleSubmit()
		} else {
			goNext()
		}
	}, [current, questions.length, handleSubmit, goNext])

	const { timeLeft } = useQuizTimer(
		started && !submitting,
		QUESTION_TIME,
		handleTimeExpire,
		current, // сброс таймера при каждом новом вопросе
	)

	// ── Security ────────────────────────────────────────────────────────────
	useQuizSecurity(started, handleViolation)

	// ── Answers ─────────────────────────────────────────────────────────────
	const toggleAnswer = useCallback(
		(answerId: string) => {
			const qid = question.id

			setUserAnswers(prev => {
				const existing = prev[qid] ?? []

				if (question.type === 'single') {
					return { ...prev, [qid]: [answerId] }
				}

				return {
					...prev,
					[qid]: existing.includes(answerId)
						? existing.filter(id => id !== answerId)
						: [...existing, answerId],
				}
			})
		},
		[question],
	)

	// ── Helpers ─────────────────────────────────────────────────────────────
	const formatTime = (sec: number) =>
		`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

	// ── Render ───────────────────────────────────────────────────────────────
	if (!started) {
		return <QuizStartScreen startQuiz={startQuiz} />
	}

	const chosen = userAnswers[question?.id] ?? []

	return (
		<div className={styles.wrap}>
			<QuizHeader
				current={current}
				questions={questions}
				questionTimeLeft={timeLeft}
				formatTime={formatTime}
			/>

			{question?.type !== 'text' ? (
				<QuizAnswers
					question={question}
					chosen={chosen}
					toggleAnswer={toggleAnswer}
				/>
			) : (
				<QuizTextAnswer
					question={question}
					chosen={chosen}
					setUserAnswers={setUserAnswers}
				/>
			)}

			<QuizNavigation
				current={current}
				questions={questions}
				submitting={submitting}
				goNext={goNext}
				handleSubmit={handleSubmit}
			/>
		</div>
	)
}
