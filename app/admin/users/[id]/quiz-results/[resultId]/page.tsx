import { notFound } from 'next/navigation'

import QuizResultDetails from './QuizResultDetails'
import { createClient } from '@/lib/supabase/server'

type Props = {
  params: Promise<{
    id: string
    resultId: string
  }>
}

export default async function QuizResultPage({
  params,
}: Props) {
  const { id: userId, resultId } = await params

  const supabase = await createClient()

  const { data: result, error } = await supabase
    .from('quiz_results')
    .select(`
      id,
      user_id,
      attempt_num,
      score,
      max_score,
      percent,
      passed,
      status,
      time_spent_sec,
      submitted_at,

      quiz_user_answers (
        id,
        question_id,
        text_answer,

        selected_options:quiz_user_answer_options (
          answer_id
        ),

        question:questions (
          id,
          text,
          type,
          order_index,

          answers (
            id,
            text,
            is_correct,
            order_index
          )
        )
      )
    `)
    .eq('id', resultId)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('QUIZ RESULT ERROR:', error)
    notFound()
  }

  if (!result) {
    notFound()
  }

  /*
   * Supabase иногда возвращает relation questions
   * как массив даже для связи many-to-one.
   */
  const userAnswers = (result.quiz_user_answers ?? []).map(
    (userAnswer) => {
      const question = Array.isArray(userAnswer.question)
        ? userAnswer.question[0]
        : userAnswer.question

      const selectedAnswerIds = (
        userAnswer.selected_options ?? []
      ).map((option) => option.answer_id)

      return {
        id: userAnswer.id,
        question_id: userAnswer.question_id,
        text_answer: userAnswer.text_answer,
        selected_answer_ids: selectedAnswerIds,

        question: {
          id: question?.id ?? userAnswer.question_id,
          text: question?.text ?? 'Питання не знайдено',
          type: question?.type ?? undefined,
          order_index: question?.order_index ?? 0,

          answers: [...(question?.answers ?? [])].sort(
            (a, b) =>
              (a.order_index ?? 0) -
              (b.order_index ?? 0)
          ),
        },
      }
    }
  )

  const normalizedResult = {
    id: result.id,
    attempt_num: result.attempt_num,
    score: result.score,
    max_score: result.max_score,
    percent: result.percent,
    passed: result.passed,
    status: result.status,
    time_spent_sec: result.time_spent_sec,
    submitted_at: result.submitted_at,

    user_answers: userAnswers,
  }

  return (
    <QuizResultDetails
      result={normalizedResult as any}
    />
  )
}