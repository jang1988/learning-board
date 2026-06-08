// ============================================================
// DATABASE TYPES
// ============================================================

export type UserRole = 'manager' | 'admin'
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed'
export type QuestionType = 'single' | 'multiple' | 'text'
export type MaterialType = 'pdf' | 'link' | 'image' | 'doc'
export type TopicStatus = 'completed' | 'in_progress' | 'not_started'

export interface Profile {
	id: string
	full_name: string
	email: string
	role: UserRole
	avatar_url?: string
	department?: string
	hired_at?: string
	created_at: string
	updated_at: string
}

export type Topic = {
	id: string
	title: string
	description: string | null
	is_required: boolean
	order_index: number

	lessons: {
		id: string

		lesson_progress: {
			user_id: string
			status: string
		}[]
	}[]

	quizzes: {
		id: string
	}[]
}

export type EnrichedTopic = Topic & {
	lessonsTotal: number
	lessonsDone: number
	pct: number
	status: TopicStatus
	hasQuiz: boolean
}

export type LessonProgressStatus = 'completed' | 'in_progress' | 'not_started'

export type Lesson = {
	id: string
	title: string
	order_index: number

	materials: Material[]

	lesson_progress: LessonProgress[]
}

export type Material = {
	id: string
	title: string
	type: string
	url: string
}

export interface Quiz {
	id: string
	topic_id: string
	title: string
	passing_score: number
	max_attempts: number
	time_limit_sec?: number
	created_at: string
	// joined
	questions?: Question[]
	last_result?: QuizResult
}

export type QuizCard = {
	topicId: string

	quiz: any

	quizResult: any | null

	isPending: boolean
	isReviewed: boolean
	hasPassed: boolean

	attemptsLeft: number

	canStartQuiz: boolean
	isLocked: boolean
}

export interface Question {
	id: string
	quiz_id: string
	text: string
	type: QuestionType
	order_index: number
	points: number
	answers?: Answer[]
}

export interface Answer {
	id: string
	question_id: string
	text: string
	is_correct?: boolean // скрыто при прохождении
	order_index: number
}

export type LessonProgress = {
	status: LessonProgressStatus
	completed_at: string | null
	user_id: string
}

export interface TopicProgress {
	id: string
	user_id: string
	topic_id: string
	status: ProgressStatus
	lessons_done: number
	lessons_total: number
	started_at?: string
	completed_at?: string
}

export type QuizResultStatus = 'pending' | 'reviewed'

export type QuizResult = {
	id: string

	passed: boolean

	status: QuizResultStatus

	attempt_num: number
}

// ============================================================
// UI / APP TYPES
// ============================================================

export interface QuizAnswer {
	question_id: string
	answer_ids: string[] // для single/multiple
	text_answer?: string // для text
}

export interface AdminStats {
	total_users: number
	active_users: number // начали хотя бы 1 тему
	completed_users: number // прошли все обязательные темы
	avg_progress_percent: number
	total_topics: number
	avg_quiz_score: number
}

export interface UserProgressSummary {
	profile: Profile
	topics_completed: number
	topics_total: number
	progress_percent: number
	last_activity?: string
	quiz_avg_score?: number
}

// ─── Shared Quiz Types ───────────────────────────────────────────────────────

export interface QuizQuestion {
	id: string
	type: QuestionType
	points?: number
	order_index?: number
	answers?: QuizAnswerRaw[]
}

export interface QuizAnswerRaw {
	id: string
	question_id: string
	is_correct: boolean
	order_index?: number
}

/** Answer row fetched from DB (is_correct included) */
export interface QuizAnswerDB {
	id: string
	question_id: string
	is_correct: boolean
}

/** Map of question_id → array of selected answer_ids */
export type UserAnswers = Record<string, string[]>

export interface QuizMeta {
	id: string
	passing_score: number
	questions?: QuizQuestion[]
}

export interface SubmitResult {
	passed: boolean
	percent: number
	/** true when there are unevaluated text answers */
	pending: boolean
}

export interface QuizAnswerSafe {
    id: string
    question_id: string
    order_index?: number      // is_correct намеренно отсутствует
}

export interface QuizQuestionSafe extends Omit<QuizQuestion, 'answers'> {
    answers?: QuizAnswerSafe[] // после sanitize — без is_correct
}

export interface QuizMetaSafe extends Omit<QuizMeta, 'questions'> {
    questions?: QuizQuestionSafe[]
}