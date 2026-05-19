'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './text-answers.module.css'

interface Props {
  answer: any
  adminId: string
}

export default function TextAnswerReviewer({ answer, adminId }: Props) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'correct' | 'wrong'>('idle')

  const [isPending, startTransition] = useTransition()

  const router = useRouter()

  const handleReview = async (isCorrect: boolean) => {
    setStatus('saving')

    const supabase = createClient()

    // 1. Обновляем ответ
    await supabase
      .from('text_answers')
      .update({
        is_correct: isCorrect,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', answer.id)

    // 2. Получаем все ответы этого quiz_result
    const { data: siblings } = await supabase
      .from('text_answers')
      .select('id, is_correct, questions(points)')
      .eq('quiz_result_id', answer.quiz_result_id)

    if (!siblings) {
      setStatus(isCorrect ? 'correct' : 'wrong')

      startTransition(() => {
        router.refresh()
      })

      return
    }

    // 3. Подставляем текущий ответ
    const siblingsWithCurrent = siblings.map(s =>
      s.id === answer.id
        ? { ...s, is_correct: isCorrect }
        : s
    )

    // 4. Проверяем завершены ли все
    const allDone = siblingsWithCurrent.every(
      s => s.is_correct !== null
    )

    if (!allDone) {
      setStatus(isCorrect ? 'correct' : 'wrong')

      startTransition(() => {
        router.refresh()
      })

      return
    }

    // 5. Считаем бонусные баллы
    let bonusPoints = 0

    for (const s of siblingsWithCurrent) {
      if (s.is_correct) {
        bonusPoints += (s.questions as any)?.points ?? 0
      }
    }

    // 6. Получаем текущий результат теста
    const { data: qr } = await supabase
      .from('quiz_results')
      .select('score, max_score, quiz_id')
      .eq('id', answer.quiz_result_id)
      .single()

    if (!qr) {
      setStatus(isCorrect ? 'correct' : 'wrong')

      startTransition(() => {
        router.refresh()
      })

      return
    }

    // 7. Получаем passing_score
    const { data: quiz } = await supabase
      .from('quizzes')
      .select('passing_score')
      .eq('id', qr.quiz_id)
      .single()

    const passingScore = quiz?.passing_score ?? 80

    const newScore = (qr.score ?? 0) + bonusPoints

    const newPercent = Math.round(
      (newScore / qr.max_score) * 100
    )

    const passed = newPercent >= passingScore

    // 8. Обновляем результат теста
    await supabase
      .from('quiz_results')
      .update({
        score: newScore,
        percent: newPercent,
        passed,
        status: 'reviewed',
      })
      .eq('id', answer.quiz_result_id)

    // 9. UI success state
    setStatus(isCorrect ? 'correct' : 'wrong')

    // 10. Обновляем server component
    startTransition(() => {
      router.refresh()
    })
  }

  if (status === 'correct' || status === 'wrong') {
    return (
      <div
        className={`${styles.card} ${
          status === 'correct'
            ? styles.cardCorrect
            : styles.cardWrong
        }`}
      >
        <div className={styles.doneLine}>
          <span
            className={`badge ${
              status === 'correct'
                ? 'badge--green'
                : 'badge--red'
            }`}
          >
            {status === 'correct'
              ? '✓ Зараховано'
              : '✕ Не зараховано'}
          </span>

          <span className={styles.doneUser}>
            {(answer.profiles as any)?.full_name}
          </span>
        </div>
      </div>
    )
  }

  const q = answer.questions
  const quiz = q?.quizzes
  const topic = quiz?.topics

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <div className={styles.userName}>
            {(answer.profiles as any)?.full_name}
          </div>

          <div className={styles.userMeta}>
            {(answer.profiles as any)?.email}

            {(answer.profiles as any)?.department &&
              ` · ${(answer.profiles as any)?.department}`}
          </div>
        </div>

        <div className={styles.cardBadges}>
          <span className="badge badge--gray">
            {q?.points} балів
          </span>
        </div>
      </div>

      <div className={styles.context}>
        <span className={styles.ctxTopic}>
          {topic?.title}
        </span>
      </div>

      <div className={styles.questionBox}>
        <div className={styles.boxLabel}>
          Питання
        </div>

        <div className={styles.boxText}>
          {q?.text}
        </div>
      </div>

      <div className={styles.answerBox}>
        <div className={styles.boxLabel}>
          Відповідь студента
        </div>

        <div className={styles.boxText}>
          {answer.answer_text}
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.wrongBtn}
          onClick={() => handleReview(false)}
          disabled={status === 'saving' || isPending}
        >
          ✕ Неправильно
        </button>

        <button
          className={styles.correctBtn}
          onClick={() => handleReview(true)}
          disabled={status === 'saving' || isPending}
        >
          ✓ Правильно
        </button>
      </div>

      {(status === 'saving' || isPending) && (
        <div className={styles.saving}>
          Зберігаємо...
        </div>
      )}
    </div>
  )
}