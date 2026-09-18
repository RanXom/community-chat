function Composer({
  value,
  onChange,
  onSend,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <form
      className="composer"
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
    >
      <span>&gt;</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="type message..."
        autoFocus
      />
    </form>
  );
}

export default Composer;