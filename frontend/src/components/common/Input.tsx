import "./Input.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({ label, error, id, ...props }: InputProps) {
  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        id={id}
        className={`form-input ${error ? "form-input-error" : ""}`}
        aria-invalid={!!error}
        {...props}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
