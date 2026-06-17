import EmployeeCard from './EmployeeCard'
import styles from './EmployeesGrid.module.css'


export default function EmployeesGrid({
	employees
}: {
	employees: any[]
}) {
	return (
		<div className={styles.cardsGrid}>
			{employees.map(employee => (
				<EmployeeCard
					key={employee.id}
					employee={employee}
				/>
			))}
		</div>
	)
}