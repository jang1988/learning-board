import styles from './QuizStartScreen.module.css'

export default function QuizStartScreen({startQuiz}: {startQuiz: () => void}) {
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