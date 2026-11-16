import { useRef, useState } from "react"
import { Upload, LoaderCircle } from "lucide-react"

export default function FileUploader({ accept, multiple = false, onFiles, disabled = false, busy = false, title, hint, icon: Icon = Upload }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = (list) => {
    const files = Array.from(list || [])
    if (files.length > 0 && !disabled && !busy) {
      onFiles(multiple ? files : files.slice(0, 1))
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  const handleKey = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      inputRef.current?.click()
    }
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && !busy && inputRef.current?.click()}
      onKeyDown={handleKey}
      onDragOver={(event) => {
        event.preventDefault()
        if (!disabled) {
          setDragging(true)
        }
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-500 ${
        dragging ? "border-ink-600 bg-ink-50" : "border-ink-200 bg-white hover:border-ink-400 hover:bg-ink-50/60"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          handleFiles(event.target.files)
          event.target.value = ""
        }}
      />
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-50 text-ink-700 transition-transform group-hover:scale-105">
        {busy ? <LoaderCircle className="h-6 w-6 animate-spin" aria-hidden="true" /> : <Icon className="h-6 w-6" aria-hidden="true" />}
      </span>
      <p className="text-sm font-semibold text-ink-900">{title}</p>
      <p className="mt-1 text-xs text-ink-500">{hint}</p>
    </div>
  )
}
