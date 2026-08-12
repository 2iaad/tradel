"use client"

import { useId, useState } from "react"
import {
  CheckCircle2,
  Copy,
  EyeIcon,
  EyeOffIcon,
  RefreshCw,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type PasswordFieldProps = {
  label?: string
  name?: string
  placeholder?: string
  className?: string
  inputClassName?: string
  labelClassName?: string
  showChecklist?: boolean
  allowGenerate?: boolean
  minLength?: number
  maxLength?: number
  required?: boolean
  autoComplete?: string
}

/*
 * Registration rules mirrored from RegisterDto:
 * - @Length(10, 20) -> Input minLength/maxLength and the length checklist item.
 * - @Matches lowercase -> Input pattern and the lowercase checklist item.
 * - @Matches uppercase -> Input pattern and the uppercase checklist item.
 * - @Matches number -> Input pattern and the number checklist item.
 */
export default function PasswordField({
  label = "Password",
  name = "password",
  placeholder = "Enter your password",
  className,
  inputClassName,
  labelClassName,
  showChecklist = true,
  allowGenerate = true,
  minLength = 10,
  maxLength = 20,
  required = false,
  autoComplete = "new-password",
}: PasswordFieldProps) {
  const id = useId()
  const [isVisible, setIsVisible] = useState(false)
  const [value, setValue] = useState("")
  const [copied, setCopied] = useState(false)

  const checks = [
    {
      label: `Between ${minLength} and ${maxLength} characters`,
      valid: value.length >= minLength && value.length <= maxLength,
    },
    { label: "One uppercase letter", valid: /[A-Z]/.test(value) },
    { label: "One lowercase letter", valid: /[a-z]/.test(value) },
    { label: "One number", valid: /\d/.test(value) },
  ]

  const passed = checks.filter((check) => check.valid).length
  const strength = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"][passed]
  const strengthColor =
    passed <= 1
      ? "bg-loss"
      : passed === 2
        ? "bg-primary"
        : passed === 3
          ? "bg-blue-500"
          : "bg-profit"

  const generatePassword = () => {
    const groups = [
      "abcdefghijklmnopqrstuvwxyz",
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      "0123456789",
    ]
    const allCharacters = groups.join("")
    const length = Math.min(maxLength, Math.max(12, minLength))
    const characters = groups.map(
      (group) => group[Math.floor(Math.random() * group.length)],
    )

    while (characters.length < length) {
      characters.push(allCharacters[Math.floor(Math.random() * allCharacters.length)])
    }

    for (let index = characters.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1))
      ;[characters[index], characters[randomIndex]] = [characters[randomIndex], characters[index]]
    }

    setValue(characters.join(""))
    setCopied(false)
  }

  const copyToClipboard = async () => {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={cn("w-full space-y-2", className)}>
      <Label htmlFor={id} className={labelClassName}>
        {label}
      </Label>

      <div className="relative flex items-center">
        <Input
          id={id}
          name={name}
          value={value}
          onChange={(event) => {
            setValue(event.target.value)
            setCopied(false)
          }}
          placeholder={placeholder}
          type={isVisible ? "text" : "password"}
          minLength={minLength}
          maxLength={maxLength}
          required={required}
          autoComplete={autoComplete}
          pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*"
          title={`Use ${minLength}–${maxLength} characters with an uppercase letter, a lowercase letter, and a number`}
          className={cn("pr-20", inputClassName)}
        />

        <button
          type="button"
          onClick={() => setIsVisible((visible) => !visible)}
          aria-label={isVisible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-10 flex items-center px-2 text-content-faint transition-colors hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {isVisible ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
        </button>

        <button
          type="button"
          onClick={copyToClipboard}
          disabled={!value}
          aria-label="Copy password"
          className="absolute inset-y-0 right-0 flex items-center px-3 text-content-faint transition-colors hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
        >
          <Copy size={15} />
        </button>
      </div>

      {allowGenerate && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-2"
          onClick={generatePassword}
        >
          <RefreshCw size={14} />
          Generate strong password
        </Button>
      )}

      {value && (
        <div className="space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full transition-all duration-300", strengthColor)}
              style={{ width: `${(passed / checks.length) * 100}%` }}
            />
          </div>
          <p className="flex items-center gap-2 text-ui-sm text-content-faint">
            Strength: {strength}
            {copied && <span className="text-profit">Copied!</span>}
          </p>
        </div>
      )}

      {showChecklist && (
        <ul className="space-y-1 text-ui-sm">
          {checks.map((check) => (
            <li
              key={check.label}
              className={cn(
                "flex items-center gap-2",
                check.valid ? "text-profit" : "text-content-faint",
              )}
            >
              {check.valid ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              {check.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
