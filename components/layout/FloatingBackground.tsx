export default function FloatingBackground() {
  return (
    <ul className="floating-boxes" aria-hidden="true">
      {Array.from({ length: 10 }).map((_, index) => (
        <li key={index} />
      ))}
    </ul>
  )
}