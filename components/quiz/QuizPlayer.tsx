'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Quiz, Question, QuizAnswer } from '@/types'
import styles from './QuizPlayer.module.css'

interface QuizPlayerProps {
  quiz: Quiz & { questions: (Question & { answers: { id: string; text: string; order_index: number }[] })[] }
  userId: string
  attemptNum: number
  onFinish: (result: { passed: boolean; percent: number }) => void
}

export default function QuizPlayer({ quiz, userId, attemptNum, onFinish }: QuizPlayerProps) {
  const [current, setCurrent] = useState(0)
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({})
  const [timeLeft, setTimeLeft] = useState(quiz.time_limit_sec ?? null)
  const [submitting, setSubmitting] = useState(false)

  const questions = quiz.questions ?? []
  const question = questions[current]

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)
    const supabase = createClient()

    // Загружаем правильные ответы
    const { data: allAnswers } = await supabase
      .from('answers')
      .select('id, question_id, is_correct')
      .in('question_id', questions.map(q => q.id))

    let totalPoints = 0
    let earnedPoints = 0

    for (const q of questions) {
      totalPoints += q.points
      const correctIds = (allAnswers ?? [])
        .filter(a => a.question_id === q.id && a.is_correct)
        .map(a => a.id)
      const chosen = userAnswers[q.id] ?? []

      if (q.type === 'single' || q.type === 'multiple') {
        const correct = correctIds.sort().join(',') === chosen.sort().join(',')
        if (correct) earnedPoints += q.points
      } else if (q.type === 'text') {
        // Text answers — admin reviews manually, give partial credit
        if (chosen.length > 0 && chosen[0].trim().length > 0) earnedPoints += q.points
      }
    }

    const percent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0
    const passed = percent >= quiz.passing_score

    await supabase.from('quiz_results').insert({
      user_id: userId,
      quiz_id: quiz.id,
      score: earnedPoints,
      max_score: totalPoints,
      percent,
      passed,
      attempt_num: attemptNum,
      time_spent_sec: quiz.time_limit_sec ? quiz.time_limit_sec - (timeLeft ?? 0) : null,
    })

    onFinish({ passed, percent })
  }, [submitting, questions, userAnswers, quiz, userId, attemptNum, timeLeft, onFinish])

  // Таймер
  useEffect(() => {
    if (!timeLeft) return
    if (timeLeft <= 0) { handleSubmit(); return }
    const t = setTimeout(() => setTimeLeft(s => (s ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, handleSubmit])

  const toggleAnswer = (answerId: string) => {
    const qid = question.id
    setUserAnswers(prev => {
      const current = prev[qid] ?? []
      if (question.type === 'single') {
        return { ...prev, [qid]: [answerId] }
      }
      const next = current.includes(answerId)
        ? current.filter(id => id !== answerId)
        : [...current, answerId]
      return { ...prev, [qid]: next }
    })
  }

  const setTextAnswer = (text: string) => {
    setUserAnswers(prev => ({ ...prev, [question.id]: [text] }))
  }

  const chosen = userAnswers[question?.id] ?? []
  const progress = ((current + 1) / questions.length) * 100

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.qCounter}>Питання {current + 1} з {questions.length}</div>
          <div className={styles.quizTitle}>{quiz.title}</div>
        </div>
        {timeLeft !== null && (
          <div className={`${styles.timer} ${timeLeft < 60 ? styles.timerWarn : ''}`}>
            ⏱ {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="progress-bar" style={{ marginBottom: 24 }}>
        <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <div className={styles.question}>
        <p className={styles.questionText}>{question?.text}</p>
        {question?.type === 'multiple' && (
          <p className={styles.hint}>Виберіть усі відповідні варіанти</p>
        )}
      </div>

      {/* Answers */}
      {question?.type !== 'text' ? (
        <div className={styles.answers}>
          {question?.answers?.map(answer => {
            const selected = chosen.includes(answer.id)
            return (
              <button
                key={answer.id}
                className={`${styles.answerBtn} ${selected ? styles.selected : ''}`}
                onClick={() => toggleAnswer(answer.id)}
              >
                <span className={`${styles.answerCheck} ${selected ? styles.checkSelected : ''}`}>
                  {question.type === 'single' ? (selected ? '●' : '○') : (selected ? '▪' : '□')}
                </span>
                {answer.text}
              </button>
            )
          })}
        </div>
      ) : (
        <textarea
          className={styles.textAnswer}
          placeholder="Введіть вашу відповідь..."
          value={chosen[0] ?? ''}
          onChange={e => setTextAnswer(e.target.value)}
          rows={4}
        />
      )}

      {/* Navigation */}
      <div className={styles.nav}>
        <button
          className={styles.prevBtn}
          onClick={() => setCurrent(c => c - 1)}
          disabled={current === 0}
        >
          ← Назад
        </button>

        <div className={styles.dots}>
          {questions.map((_, i) => (
            <button
              key={i}
              className={`${styles.dot} ${i === current ? styles.dotCurrent : ''} ${userAnswers[questions[i].id]?.length > 0 ? styles.dotAnswered : ''}`}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>

        {current < questions.length - 1 ? (
          <button
            className={styles.nextBtn}
            onClick={() => setCurrent(c => c + 1)}
          >
            Далее →
          </button>
        ) : (
          <button
            className={styles.submitBtn}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Надсилання...' : 'Завершити тест'}
          </button>
        )}
      </div>
    </div>
  )
}