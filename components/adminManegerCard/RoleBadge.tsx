import styles from './RoleBadge.module.css'


export default function RoleBadge({
	currentRole
}: {
	currentRole: string
}) {
	const isAdmin = currentRole === 'admin'

	return (
		<span
			className={`badge ${
				isAdmin
					? 'badge--blue'
					: 'badge--gray'
			} ${styles.roleBadge}`}
		>
			{isAdmin ? 'Адмін' : 'Співробітник'}
		</span>
	)
}