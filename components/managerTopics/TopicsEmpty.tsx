import styles from './TopicsEmpty.module.css'

export function TopicsEmpty() {
  return (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>▤</div>

      <div className={styles.emptyTitle}>
        Тем поки немає
      </div>

      <p className={styles.emptySub}>
        Адміністратор ще не додав теми навчання
      </p>
    </div>
  )
}