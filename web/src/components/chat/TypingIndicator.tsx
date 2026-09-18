function TypingIndicator({ username }: { username: string }) {
  return <p className="typing">&gt; {username} is typing...</p>;
}

export default TypingIndicator;