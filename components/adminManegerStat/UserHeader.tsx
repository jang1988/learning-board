import styles from '@/app/admin/users/[id]/user.module.css'

export default function UserHeader({ employee }: any) {
	const initials = employee.full_name
		?.split(' ')
		.slice(0, 2)
		.map((w: string) => w[0])
		.join('')
		.toUpperCase()

	return (
		<div className={styles.header}>
			<div className={styles.avatar}>{initials}</div>

			<div>
				<h1 className={styles.name}>{employee.full_name}</h1>
				<p className={styles.dept}>{employee.department || '—'}</p>
			</div>
		</div>
	)
}