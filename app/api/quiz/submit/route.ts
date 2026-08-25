import { getQuizAttemptsCount } from '@/api/getQuizResults'
import { calculateQuizResult } from '@/lib/manager/calculateQuizResult'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import type {
  QuizAnswerDB,
  QuizMeta,
  QuizQuestion,
  SubmitResult,
  UserAnswers,
} from '@/types'
import { NextResponse } from 'next/server'

type SubmitQuizBody = {
  quizId?: string
  attemptNum?: number
  userAnswers?: UserAnswers
  forceFail?: boolean
  timeSpentSec?: number
}

type QuizForSubmit = QuizMeta & {
  max_attempts: number
  questions: (QuizQuestion & {
    answers?: QuizAnswerDB[]
  })[]
}

type QuizUserAnswerInsert = {
  quiz_result_id: string
  question_id: string
  user_id: string
  text_answer: string | null
}

type QuizUserAnswerOptionInsert = {
  user_answer_id: string
  answer_id: string
}

/**
 * Строка для таблицы quiz_user_answers.
 *
 * answer_id используется для обычных вопросов.
 * text_answer используется для текстовых вопросов.
 */

function badRequest(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    { status },
  )
}

function isUserAnswers(
  value: unknown,
): value is UserAnswers {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return false
  }

  return Object.values(value).every(
    (answerIds) =>
      Array.isArray(answerIds) &&
      answerIds.every(
        (answerId) =>
          typeof answerId === 'string',
      ),
  )
}

/**
 * Сохраняет ответы пользователя для попытки теста.
 *
 * Одна строка quiz_user_answers на вопрос.
 * Для single/multiple выбранные варианты пишутся
 * в отдельную таблицу quiz_user_answer_options.
 */
async function saveQuizUserAnswers({
  admin,
  quizResultId,
  userId,
  questions,
  userAnswers,
}: {
  admin: ReturnType<typeof createAdminClient>
  quizResultId: string
  userId: string
  questions: QuizForSubmit['questions']
  userAnswers: UserAnswers
}) {
  const rows: QuizUserAnswerInsert[] = []
  const selectedByQuestion = new Map<string, string[]>()

  for (const [questionId, selectedValues] of Object.entries(userAnswers)) {
    const question = questions.find((item) => item.id === questionId)

    if (!question) continue

    if (question.type === 'text') {
      const text = selectedValues[0]?.trim() ?? ''
      if (!text) continue

      rows.push({
        quiz_result_id: quizResultId,
        question_id: questionId,
        user_id: userId,
        text_answer: text,
      })
      continue
    }

    const validAnswerIds = new Set(
      (question.answers ?? []).map((answer) => answer.id),
    )

    const chosen = selectedValues.filter((answerId) =>
      validAnswerIds.has(answerId),
    )

    if (!chosen.length) continue

    rows.push({
      quiz_result_id: quizResultId,
      question_id: questionId,
      user_id: userId,
      text_answer: null,
    })

    selectedByQuestion.set(questionId, chosen)
  }

  if (!rows.length) {
    return null
  }

  const { data: insertedRows, error } = await admin
    .from('quiz_user_answers')
    .insert(rows)
    .select('id, question_id')

  if (error) {
    return error
  }

  const optionRows: QuizUserAnswerOptionInsert[] = []

  for (const inserted of insertedRows ?? []) {
    const chosen = selectedByQuestion.get(inserted.question_id)
    if (!chosen) continue

    for (const answerId of chosen) {
      optionRows.push({
        user_answer_id: inserted.id,
        answer_id: answerId,
      })
    }
  }

  if (optionRows.length) {
    const { error: optionsError } = await admin
      .from('quiz_user_answer_options')
      .insert(optionRows)

    if (optionsError) {
      return optionsError
    }
  }

  return null
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return badRequest(
      'Unauthorized',
      401,
    )
  }

  const body =
    (await request
      .json()
      .catch(() => null)) as
      | SubmitQuizBody
      | null

  if (
    !body?.quizId ||
    typeof body.quizId !== 'string'
  ) {
    return badRequest(
      'quizId is required',
    )
  }

  if (
    !Number.isInteger(body.attemptNum) ||
    (body.attemptNum ?? 0) < 1
  ) {
    return badRequest(
      'attemptNum must be a positive integer',
    )
  }

  if (!isUserAnswers(body.userAnswers)) {
    return badRequest(
      'userAnswers has an invalid shape',
    )
  }

  const admin = createAdminClient()

  /**
   * Загружаем тест вместе с вопросами
   * и вариантами ответов.
   *
   * is_correct читается только сервером
   * через service-role client.
   */
  const {
    data: quiz,
    error: quizError,
  } = await admin
    .from('quizzes')
    .select(
      `
      id,
      passing_score,
      max_attempts,
      questions(
        id,
        text,
        type,
        points,
        order_index,
        answers(
          id,
          question_id,
          text,
          is_correct,
          order_index
        )
      )
    `,
    )
    .eq('id', body.quizId)
    .maybeSingle()

  if (quizError) {
    return badRequest(
      quizError.message,
      500,
    )
  }

  if (!quiz) {
    return badRequest(
      'Quiz not found',
      404,
    )
  }

  const typedQuiz =
    quiz as QuizForSubmit

  /**
   * Проверяем номер попытки
   * непосредственно по БД.
   */
  const attemptsDone =
    await getQuizAttemptsCount(
      admin,
      user.id,
      typedQuiz.id,
    )

  const expectedAttempt =
    attemptsDone + 1

  if (
    body.attemptNum !== expectedAttempt ||
    expectedAttempt > typedQuiz.max_attempts
  ) {
    return badRequest(
      'Quiz attempt is no longer available',
      409,
    )
  }

  const questions =
    typedQuiz.questions ?? []

  const maxScore = questions.reduce(
    (sum, question) =>
      sum + (question.points ?? 1),
    0,
  )

  const timeSpentSec = Math.max(
    0,
    Math.floor(
      body.timeSpentSec ?? 0,
    ),
  )

  /**
   * ============================================================
   * FORCE FAIL
   * ============================================================
   *
   * Античит завершил тест.
   *
   * Даже в этом случае сохраняем то,
   * что пользователь успел выбрать.
   */
  if (body.forceFail) {
    const {
      data: savedResult,
      error,
    } = await admin
      .from('quiz_results')
      .insert({
        user_id: user.id,
        quiz_id: typedQuiz.id,
        score: 0,
        max_score: maxScore,
        percent: 0,
        passed: false,
        attempt_num: body.attemptNum,
        status: 'reviewed',
        time_spent_sec: timeSpentSec,
      })
      .select('id')
      .single()

    if (error) {
      return badRequest(
        error.message,
        500,
      )
    }

    /**
     * Сохраняем все ответы,
     * которые были выбраны до нарушения.
     */
    if (savedResult) {
      const answersError =
        await saveQuizUserAnswers({
          admin,
          quizResultId:
            savedResult.id,
          userId: user.id,
          questions,
          userAnswers:
            body.userAnswers,
        })

      if (answersError) {
        return badRequest(
          answersError.message,
          500,
        )
      }
    }

    return NextResponse.json({
      passed: false,
      percent: 0,
      pending: false,
    } satisfies SubmitResult)
  }

  /**
   * ============================================================
   * Обычная отправка теста
   * ============================================================
   */

  const autoQuestions =
    questions.filter(
      (question) =>
        question.type !== 'text',
    )

  const textQuestions =
    questions.filter(
      (question) =>
        question.type === 'text',
    )

  const answers =
    autoQuestions.flatMap(
      (question) =>
        question.answers ?? [],
    )

  /**
   * Сервер самостоятельно
   * пересчитывает результат.
   */
  const result =
    calculateQuizResult({
      questions,
      answers,
      userAnswers:
        body.userAnswers,
    })

  /**
   * Находим заполненные текстовые вопросы.
   */
  const filledTextQuestions =
    textQuestions.filter(
      (question) =>
        (
          body.userAnswers?.[
            question.id
          ]?.[0] ?? ''
        ).trim().length > 0,
    )

  const pending =
    filledTextQuestions.length > 0

  const passed =
    !pending &&
    result.percent >=
      typedQuiz.passing_score

  /**
   * Сначала создаём quiz_results.
   *
   * Его id понадобится для quiz_user_answers.
   */
  const {
    data: savedResult,
    error: insertError,
  } = await admin
    .from('quiz_results')
    .insert({
      user_id: user.id,
      quiz_id: typedQuiz.id,
      score: result.earned,
      max_score: result.maxScore,
      percent: result.percent,
      passed,
      attempt_num: body.attemptNum,
      status: pending
        ? 'pending'
        : 'reviewed',
      time_spent_sec: timeSpentSec,
    })
    .select('id')
    .single()

  if (insertError) {
    return badRequest(
      insertError.message,
      500,
    )
  }

  /**
   * ============================================================
   * Сохраняем ВСЕ ответы пользователя
   * ============================================================
   */
  if (savedResult) {
    const answersError =
      await saveQuizUserAnswers({
        admin,
        quizResultId:
          savedResult.id,
        userId: user.id,
        questions,
        userAnswers:
          body.userAnswers,
      })

    if (answersError) {
      return badRequest(
        answersError.message,
        500,
      )
    }
  }

  /**
   * ============================================================
   * TEXT ANSWERS
   * ============================================================
   *
   * Оставляем существующую систему
   * проверки текстовых ответов администратором.
   */
  if (
    savedResult &&
    filledTextQuestions.length
  ) {
    const { error } = await admin
      .from('text_answers')
      .insert(
        filledTextQuestions.map(
          (question) => ({
            quiz_result_id:
              savedResult.id,
            question_id:
              question.id,
            user_id: user.id,
            answer_text:
              (
                body.userAnswers?.[
                  question.id
                ]?.[0] ?? ''
              ).trim(),
            is_correct: null,
          }),
        ),
      )

    if (error) {
      return badRequest(
        error.message,
        500,
      )
    }
  }

  return NextResponse.json({
    passed,
    percent: result.percent,
    pending,
  } satisfies SubmitResult)
}