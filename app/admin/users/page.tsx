import EmployeesGrid from '@/components/adminManegerCard/EmployeesGrid'
import { getEmployees } from '@/api/getEmployees'
import styles from './users.module.css'

export default async function AdminUsers() {
	const employees = await getEmployees()

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<div>
					<h1 className={styles.title}>
						Співробітники
					</h1>

					<p className={styles.sub}>
						{employees.length} зареєстровано
					</p>
				</div>
			</div>

			<EmployeesGrid employees={employees} />
		</div>
	)
}