import Skeleton from 'react-loading-skeleton'
import styles from './topic.module.css'

export default function Loading() {
	return (
		<div className={styles.page}>
			{/* Breadcrumb */}
			<Skeleton
				width={110}
				height={16}
				style={{ marginBottom: 24 }}
			/>

			{/* Hero */}
			
				<Skeleton height={220} borderRadius={28} />
	

			{/* Progress */}
			<div style={{ marginBottom: 26 }}>
				<Skeleton
					height={10}
					borderRadius={22}
				/>
			</div>

			<div className={styles.grid}>
				{/* Lessons */}
				<div>
					<Skeleton
						width={90}
						height={24}
						style={{ marginBottom: 16 }}
					/>

					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							gap: 14
						}}
					>
						{Array.from({ length: 6 }).map((_, i) => (
							<Skeleton
								key={i}
								height={92}
								borderRadius={18}
							/>
						))}
					</div>
				</div>

				{/* Quiz */}
				<div>
					<Skeleton
						height={360}
						borderRadius={22}
					/>
				</div>
			</div>
		</div>
	)
}