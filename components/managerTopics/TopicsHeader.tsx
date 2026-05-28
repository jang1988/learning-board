import styles from './TopicsHeader.module.css'

export function TopicsHeader() {
  return (
    <div className={styles.header}>
      <h1 className={styles.title}>Теми навчання</h1>

      <p className={styles.sub}>
        Вивчайте теми послідовно та проходьте тести
      </p>
    </div>
  )
}