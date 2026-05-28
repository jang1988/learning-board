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

export interface Lesson {
	id: string
	topic_id: string
	title: string
	description?: string
	video_url: string
	duration_sec?: number
	order_index: number
	created_at: string
	// joined
	materials?: Material[]
	progress?: LessonProgress
}

export interface Material {
	id: string
	lesson_id?: string
	topic_id?: string
	title: string
	url: string
	type: MaterialType
	created_at: string
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

export interface LessonProgress {
	id: string
	user_id: string
	lesson_id: string
	status: ProgressStatus
	watch_time_sec: number
	completed_at?: string
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

export interface QuizResult {
	id: string
	user_id: string
	quiz_id: string
	score: number
	max_score: number
	percent: number
	passed: boolean
	attempt_num: number
	time_spent_sec?: number
	submitted_at: string
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
